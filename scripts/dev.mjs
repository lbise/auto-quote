import { access } from "node:fs/promises"
import net from "node:net"
import { spawn } from "node:child_process"

const PYTHON_PATH = ".venv/bin/python"
const DEFAULT_API_PORT = 8000

async function main() {
  await ensureBackendIsInstalled()
  await runCommand("npm", ["run", "db:migrate"])

  const existingBackend = await inspectBackend(DEFAULT_API_PORT)

  if (!existingBackend.portInUse) {
    await runDevServers({ apiPort: DEFAULT_API_PORT })
    return
  }

  if (existingBackend.compatible) {
    console.log(
      `Reusing existing AutoQuote backend on port ${DEFAULT_API_PORT} and starting the frontend only.`
    )
    await runDevServers({ apiPort: DEFAULT_API_PORT, reuseBackend: true })
    return
  }

  const fallbackPort = await findAvailablePort(DEFAULT_API_PORT + 1)
  console.log(
    `Port ${DEFAULT_API_PORT} is occupied by a different or outdated service. Starting AutoQuote API on port ${fallbackPort} and proxying the frontend to it.`
  )
  await runDevServers({ apiPort: fallbackPort })
}

async function ensureBackendIsInstalled() {
  try {
    await access(PYTHON_PATH)
  } catch {
    console.error("Missing .venv backend environment. Run `npm run setup:backend` first.")
    process.exit(1)
  }
}

function runCommand(command, args, options = {}) {
  const { longRunning = false } = options

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
    })

    child.on("error", reject)

    child.on("exit", (code, signal) => {
      if (longRunning) {
        process.exit(code ?? (signal ? 1 : 0))
        return
      }

      if (code === 0) {
        resolve(undefined)
        return
      }

      reject(new Error(`${command} ${args.join(" ")} exited with code ${code ?? signal}`))
    })
  })
}

function runDevServers({ apiPort, reuseBackend = false }) {
  const children = []
  const apiProxyTarget = `http://127.0.0.1:${apiPort}`

  return new Promise((resolve, reject) => {
    let settled = false

    const webChild = spawn("npm", ["run", "dev:web"], {
      stdio: "inherit",
      shell: false,
      env: {
        ...process.env,
        AUTOQUOTE_API_PROXY_TARGET: apiProxyTarget,
      },
    })

    children.push(webChild)

    if (!reuseBackend) {
      const apiChild = spawn("npm", ["run", "dev:api", "--", "--port", String(apiPort)], {
        stdio: "inherit",
        shell: false,
      })
      children.push(apiChild)
    }

    const cleanup = () => {
      for (const child of children) {
        if (!child.killed) {
          child.kill("SIGTERM")
        }
      }
    }

    const settle = (handler, value) => {
      if (settled) {
        return
      }
      settled = true
      cleanup()
      handler(value)
    }

    for (const child of children) {
      child.on("error", (error) => settle(reject, error))
      child.on("exit", (code, signal) => {
        if (settled) {
          return
        }

        if (code === 0 || signal === "SIGTERM") {
          settle(resolve)
          return
        }

        settle(reject, new Error(`dev process exited with code ${code ?? signal}`))
      })
    }

    const forwardSignal = (signal) => {
      cleanup()
      process.exit(0)
    }

    process.once("SIGINT", forwardSignal)
    process.once("SIGTERM", forwardSignal)
  })
}

function isPortInUse(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host: "127.0.0.1" })

    socket.once("connect", () => {
      socket.destroy()
      resolve(true)
    })

    socket.once("error", () => {
      resolve(false)
    })
  })
}

async function inspectBackend(port) {
  const portInUse = await isPortInUse(port)

  if (!portInUse) {
    return { portInUse: false, compatible: false }
  }

  return {
    portInUse: true,
    compatible: await isCompatibleBackendRunning(port),
  }
}

function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const server = net.createServer()

    server.listen(startPort, "127.0.0.1")
    server.on("listening", () => {
      const address = server.address()
      server.close(() => {
        if (typeof address === "object" && address?.port) {
          resolve(address.port)
          return
        }

        reject(new Error("Could not determine an available backend port."))
      })
    })

    server.on("error", () => {
      void findAvailablePort(startPort + 1).then(resolve).catch(reject)
    })
  })
}

async function isCompatibleBackendRunning(port) {
  try {
    const healthResponse = await fetch(`http://127.0.0.1:${port}/api/health`, {
      signal: AbortSignal.timeout(1200),
    })

    if (!healthResponse.ok) {
      return false
    }

    const healthData = await healthResponse.json()
    if (healthData?.status !== "ok") {
      return false
    }

    const quotesResponse = await fetch(`http://127.0.0.1:${port}/api/quotes`, {
      signal: AbortSignal.timeout(1200),
    })

    return quotesResponse.ok
  } catch {
    return false
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
