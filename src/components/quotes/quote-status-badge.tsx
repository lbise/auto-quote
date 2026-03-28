import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import type { QuoteStatus } from "@/lib/api"
import { cn } from "@/lib/utils"

const statusStyles: Record<QuoteStatus, string> = {
  draft: "border-amber-200 bg-amber-50 text-amber-700",
  ready: "border-emerald-200 bg-emerald-50 text-emerald-700",
  sent: "border-sky-200 bg-sky-50 text-sky-700",
}

function QuoteStatusBadge({ status, className }: { status: QuoteStatus; className?: string }) {
  const { t } = useTranslation()

  return (
    <Badge variant="outline" className={cn(statusStyles[status], className)}>
      {t(`status.${status}`)}
    </Badge>
  )
}

export { QuoteStatusBadge }
