export const resources = {
  fr: {
    translation: {
      app: {
        brandSubtitle: "PoC FastAPI et SQLite pour générer des devis plus vite",
        phase2InProgress: "Phase 4 en cours",
        navigation: {
          dashboard: "Tableau de bord",
          settings: "Paramètres",
        },
        language: {
          label: "Langue",
          fr: "Français",
          en: "Anglais",
        },
      },
      common: {
        untitledQuote: "Brouillon de devis sans titre",
        notSetYet: "Pas encore renseigné",
        localeShort: {
          fr: "FR",
          en: "EN",
        },
      },
      status: {
        draft: "brouillon",
        ready: "prêt",
        sent: "envoyé",
      },
      dashboard: {
        eyebrow: "Tableau de bord devis",
        title: "Créez, reprenez et structurez les brouillons avant que l'assistant commence à écrire.",
        description:
          "Le produit couvre maintenant les brouillons, l'espace de travail et le chat LLM. Cette phase ajoute la revue visuelle, les signaux \"à revoir\" et un flux d'impression plus crédible pour les démos.",
        newQuote: "Nouveau devis",
        creatingDraft: "Création du brouillon...",
        reviewDefaults: "Voir les paramètres",
        errors: {
          loadQuotes: "Impossible de charger les devis",
          createQuote: "Impossible de créer le devis",
        },
        stats: {
          totalQuotes: "Total des devis",
          drafts: "Brouillons",
          readyToSend: "Prêts à envoyer",
        },
        filters: {
          searchPlaceholder: "Rechercher par numéro, titre ou client",
          clear: "Réinitialiser les filtres",
          status: {
            label: "Filtrer par statut",
            all: "Tous",
          },
        },
        recent: {
          title: "Devis récents",
          description:
            "Ouvrez un brouillon pour modifier les informations client, les lignes et les totaux avant l'arrivée de l'automatisation par chat.",
          refresh: "Actualiser",
          loading: "Chargement des brouillons...",
          emptyTitle: "Aucun devis pour l'instant",
          emptyDescription:
            "Créez un premier brouillon pour servir de base au prochain flux avec assistant.",
          emptyAction: "Créer le premier devis",
          emptyFilteredTitle: "Aucun devis ne correspond aux filtres",
          emptyFilteredDescription:
            "Essayez un autre mot-clé ou réinitialisez les filtres pour revoir tous les brouillons.",
          missingCustomer: "Informations client non renseignées",
          priced: "Chiffré",
          needsReview: "À revoir",
          openWorkspace: "Ouvrir l'espace de travail",
          updated: "Mis à jour {{value}}",
          lineItems_one: "{{count}} ligne",
          lineItems_other: "{{count}} lignes",
        },
      },
      settings: {
        badge: "Espace paramètres",
        title: "Réglez les valeurs par défaut que votre assistant de devis doit réutiliser à chaque fois.",
        description:
          "Cet écran stocke les informations métier, la langue par défaut, les conditions de paiement, la TVA et la durée de validité que le backend injecte dans chaque nouveau brouillon.",
        badges: {
          sqlite: "Stocké dans SQLite",
          fastapi: "Connecté à FastAPI",
          phase1: "Phase 1 terminée",
        },
        loading: "Chargement des paramètres métier...",
        saved: "Les paramètres par défaut sont enregistrés et prêts pour la génération de devis.",
        footer: {
          idle: "Ces paramètres servent de base à chaque nouveau devis.",
          backendOwned: "Ligne de paramètres gérée par le backend",
        },
        actions: {
          refresh: "Actualiser",
          save: "Enregistrer les paramètres",
          saving: "Enregistrement...",
        },
        errors: {
          load: "Impossible de charger les paramètres",
          save: "Impossible d'enregistrer les paramètres",
        },
        form: {
          businessName: {
            label: "Nom de l'entreprise",
            hint: "Apparaît sur chaque devis généré.",
            placeholder: "Northline Painting Co.",
          },
          defaultCurrency: {
            label: "Devise par défaut",
            hint: "Code ISO utilisé pour le chiffrage.",
            placeholder: "USD",
          },
          businessEmail: {
            label: "Email de l'entreprise",
            hint: "Utilisé pour l'en-tête du devis et le suivi.",
            placeholder: "devis@northline.co",
          },
          businessPhone: {
            label: "Téléphone de l'entreprise",
            hint: "Visible par les prospects sur le devis.",
            placeholder: "(555) 246-8100",
          },
          businessAddress: {
            label: "Adresse de l'entreprise",
            hint: "Bloc d'adresse multi-lignes pour l'en-tête du devis.",
            placeholder: "410 River Street\nSuite 8\nPortland, OR 97204",
          },
          defaultLocale: {
            label: "Langue par défaut",
            hint: "Langue utilisée pour les nouveaux devis et le futur assistant.",
          },
          defaultTaxRate: {
            label: "Taux de TVA par défaut",
            hint: "Saisissez un pourcentage comme 20 pour 20 %.",
            placeholder: "20",
          },
          defaultValidityDays: {
            label: "Validité du devis",
            hint: "Combien de jours un brouillon reste valable.",
            placeholder: "30",
          },
          defaultPaymentTerms: {
            label: "Conditions de paiement",
            hint: "Insérées dans le devis tant qu'un modèle métier plus précis n'existe pas.",
            placeholder: "Paiement à réception.",
          },
        },
        summary: {
          title: "Aperçu des paramètres",
          taxDefault: "TVA par défaut",
          quoteValidity: "Validité du devis",
          validityDays: "{{count}} jours",
          currency: "Devise",
          language: "Langue",
        },
        assistantInputs: {
          title: "Entrées de l'assistant",
          contactDetails: "Coordonnées",
          phone: "Téléphone",
          address: "Adresse",
        },
        backend: {
          title: "Statut du backend",
          persistenceLabel: "Persistance",
          persistenceValue: "SQLite",
          persistenceDescription:
            "Les paramètres sont stockés côté backend et réutilisés entre les sessions.",
          lastSaved: "Dernière sauvegarde",
          nextUnlock: "Prochaine étape",
          nextUnlockDescription:
            "Les nouveaux devis héritent maintenant de cette langue et de ces paramètres par défaut.",
        },
      },
      quote: {
        errors: {
          missingId: "L'identifiant du devis est manquant",
          load: "Impossible de charger le devis",
          save: "Impossible d'enregistrer le devis",
        },
        loading: "Chargement de l'espace devis...",
        openErrorTitle: "Impossible d'ouvrir le devis",
        backToDashboard: "Retour au tableau de bord",
        workspaceShell: "Structure de l'espace",
        assistantTitle: "Assistant de devis",
        assistantDescription:
          "Discutez ici avec le vrai modèle pour enrichir le brouillon et appliquer des mises à jour structurées au devis.",
        lastSaved: "Dernière sauvegarde",
        validUntil: "Valide jusqu'au",
        totalsPreview: "Aperçu des totaux",
        chat: {
          hintReady: "Discutez avec l'assistant pour enrichir ce brouillon enregistré.",
          hintSaveFirst: "Enregistrez d'abord vos modifications manuelles avant d'envoyer un message à l'assistant.",
          emptyTitle: "Commencez la conversation",
          emptyDescription:
            "Décrivez le projet, le besoin du client ou les informations manquantes. L'assistant posera ensuite une question ciblée ou mettra à jour le brouillon.",
          inputPlaceholder:
            "Ex : Je dois préparer un devis pour repeindre deux salles de réunion et le hall d'accueil.",
          send: "Envoyer",
          sending: "Analyse...",
          errors: {
            send: "Impossible d'envoyer le message à l'assistant",
          },
          actions: {
            askQuestion: "Question",
            updateQuote: "Brouillon mis à jour",
          },
          roles: {
            assistant: "IA",
            owner: "Gérant",
          },
        },
        subtotal: "Sous-total",
        tax: "TVA ({{value}})",
        total: "Total",
        pricingReady:
          "Toutes les lignes sont chiffrées et prêtes pour la prochaine phase d'automatisation.",
        pricingIncomplete:
          "Au moins une ligne doit encore être chiffrée ou revue avant que le devis soit prêt.",
        editorEyebrow: "Éditeur de devis",
        editorTitle: "Structurez le brouillon avant que l'IA ne commence à aider",
        back: "Retour",
        saveQuote: "Enregistrer le devis",
        saving: "Enregistrement...",
        savingQuote: "Enregistrement du devis...",
        defaultTax: "TVA par défaut {{value}}",
        sections: {
          customerBasics: "Client et informations de base",
          scopeAndTerms: "Périmètre et conditions",
          lineItemsAndPricing: "Lignes et chiffrage",
        },
        fields: {
          quoteTitle: {
            label: "Titre du devis",
            hint: "Libellé court affiché dans les listes et aperçus.",
            placeholder: "Devis pour repeindre des bureaux",
          },
          status: {
            label: "Statut",
            hint: "Gardez les brouillons modifiables jusqu'à ce qu'ils soient prêts à partager.",
          },
          customerName: {
            label: "Nom du client",
            hint: "Contact principal pour le devis.",
            placeholder: "Morgan Lee",
          },
          company: {
            label: "Société",
            hint: "Nom de la société ou du site, si besoin.",
            placeholder: "Harbor Studio",
          },
          email: {
            label: "Email",
            hint: "Utile pour le suivi et l'envoi plus tard.",
            placeholder: "morgan@harbor.studio",
          },
          phone: {
            label: "Téléphone",
            hint: "Optionnel, mais utile pour clarifier rapidement.",
            placeholder: "(555) 901-2233",
          },
          address: {
            label: "Adresse",
            hint: "Adresse du client ou du chantier.",
            placeholder: "410 River Street\nSuite 8\nPortland, OR 97204",
          },
          locale: {
            label: "Langue du devis",
            hint: "Sera utilisée par le futur assistant et les contenus du devis.",
          },
          currency: {
            label: "Devise",
            hint: "Code ISO utilisé pour chaque ligne.",
            placeholder: "USD",
          },
          validUntil: {
            label: "Valide jusqu'au",
            hint: "Le devis reste ouvert jusqu'à cette date.",
          },
          jobSummary: {
            label: "Résumé de la mission",
            hint: "Décrit précisément le travail couvert.",
            placeholder: "Peinture intérieure d'un petit bureau avec deux salles de réunion.",
          },
          assumptions: {
            label: "Hypothèses",
            hint: "Servez-vous en pour les dépendances, contraintes d'accès ou exclusions.",
            placeholder: "Le client garantit un accès dégagé au site pendant les heures d'ouverture.",
          },
          paymentTerms: {
            label: "Conditions de paiement",
            hint: "Chargées depuis les paramètres mais modifiables pour chaque devis.",
            placeholder: "Paiement à réception.",
          },
          internalNotes: {
            label: "Notes internes",
            hint: "Visibles seulement pour vous dans l'espace de travail pour l'instant.",
            placeholder: "Confirmer le délai de livraison des matériaux avant envoi.",
          },
          description: {
            label: "Description",
            hint: "Libellé visible par le client.",
            placeholder: "Préparation et peinture des murs intérieurs",
          },
          quantity: {
            label: "Quantité",
            hint: "Les décimales sont acceptées si besoin.",
            placeholder: "1",
          },
          unit: {
            label: "Unité",
            hint: "Exemples : forfait, jour, pièce.",
            placeholder: "forfait",
          },
          unitPrice: {
            label: "Prix unitaire",
            hint: "Laissez vide pour garder la ligne à revoir.",
            placeholder: "1500",
          },
        },
        actions: {
          addLineItem: "Ajouter une ligne",
          remove: "Supprimer",
          reload: "Recharger",
          print: "Imprimer",
        },
        lineItems: {
          emptyTitle: "Aucune ligne pour l'instant",
          emptyDescription:
            "Ajoutez au moins une ligne chiffrée pour calculer les totaux et faire avancer le devis.",
          needsReview: "À revoir",
          lineTotalPreview: "Aperçu du total de ligne",
        },
        review: {
          title: "Revue avant impression",
          readyToPrint: "Le devis peut être imprimé tel quel.",
          needsAttention_one: "{{count}} ligne demande encore une vérification.",
          needsAttention_other: "{{count}} lignes demandent encore une vérification.",
          printHint: "L'impression utilise le dernier devis enregistré et affiche les éléments à revoir.",
          saveBeforePrint: "Enregistrez les dernières modifications avant d'imprimer pour garder les totaux backend comme source de vérité.",
          untitledLineItem: "Ligne {{index}} sans titre",
          reasons: {
            missingPrice: "Aucun prix unitaire n'est encore défini.",
            markedForReview: "La ligne est explicitement marquée à revoir.",
          },
        },
        print: {
          from: "Émis par",
          preparedFor: "Préparé pour",
          issuedOn: "Créé le",
          quantity: "Qté",
          unitPrice: "Prix unitaire",
          lineTotal: "Total ligne",
          assumptions: "Hypothèses",
          paymentTerms: "Conditions de paiement",
          internalNotes: "Notes internes",
          notPriced: "À chiffrer",
          reviewNoticeTitle: "Tarification incomplète",
          reviewNoticeDescription_one: "Une ligne doit encore être revue ou chiffrée avant l'envoi final.",
          reviewNoticeDescription_other: "{{count}} lignes doivent encore être revues ou chiffrées avant l'envoi final.",
        },
        footer: {
          saved: "Le devis est enregistré. Les totaux backend sont à jour.",
          idle: "Enregistrez le brouillon après vos modifications pour que le backend reste la source de vérité.",
          backendOwned: "Totaux et validité pilotés par le backend",
        },
      },
    },
  },
  en: {
    translation: {
      app: {
        brandSubtitle: "FastAPI and SQLite PoC for faster quote drafting",
        phase2InProgress: "Phase 4 in progress",
        navigation: {
          dashboard: "Dashboard",
          settings: "Settings",
        },
        language: {
          label: "Language",
          fr: "French",
          en: "English",
        },
      },
      common: {
        untitledQuote: "Untitled quote draft",
        notSetYet: "Not set yet",
        localeShort: {
          fr: "FR",
          en: "EN",
        },
      },
      status: {
        draft: "draft",
        ready: "ready",
        sent: "sent",
      },
      dashboard: {
        eyebrow: "Quote dashboard",
        title: "Create, revisit, and shape quote drafts before the assistant starts writing.",
        description:
          "The product now covers drafts, the live workspace, and LLM chat. This phase adds visible review states, clearer needs-review signals, and a print flow that feels demo-ready.",
        newQuote: "New quote",
        creatingDraft: "Creating draft...",
        reviewDefaults: "Review defaults",
        errors: {
          loadQuotes: "Could not load quotes",
          createQuote: "Could not create quote",
        },
        stats: {
          totalQuotes: "Total quotes",
          drafts: "Drafts",
          readyToSend: "Ready to send",
        },
        filters: {
          searchPlaceholder: "Search by quote number, title, or customer",
          clear: "Clear filters",
          status: {
            label: "Filter by status",
            all: "All",
          },
        },
        recent: {
          title: "Recent quotes",
          description:
            "Open a draft to edit customer details, line items, and totals before chat automation lands.",
          refresh: "Refresh",
          loading: "Loading saved drafts...",
          emptyTitle: "No quotes yet",
          emptyDescription:
            "Create the first draft and use it as the backbone for the upcoming assistant workflow.",
          emptyAction: "Start first quote",
          emptyFilteredTitle: "No quotes match these filters",
          emptyFilteredDescription:
            "Try another keyword or clear the filters to bring every draft back into view.",
          missingCustomer: "Customer details not set yet",
          priced: "Priced",
          needsReview: "Needs review",
          openWorkspace: "Open workspace",
          updated: "Updated {{value}}",
          lineItems_one: "{{count}} line item",
          lineItems_other: "{{count}} line items",
        },
      },
      settings: {
        badge: "Settings workspace",
        title: "Dial in the defaults your quote assistant should reuse every time.",
        description:
          "This screen stores the business details, default language, payment terms, tax rate, and validity rules the backend injects into each new quote draft.",
        badges: {
          sqlite: "SQLite-backed",
          fastapi: "FastAPI connected",
          phase1: "Phase 1 complete",
        },
        loading: "Loading business defaults...",
        saved: "Defaults saved and ready for quote generation.",
        footer: {
          idle: "These defaults seed every new quote draft.",
          backendOwned: "Backend-owned settings row",
        },
        actions: {
          refresh: "Refresh",
          save: "Save defaults",
          saving: "Saving...",
        },
        errors: {
          load: "Could not load settings",
          save: "Could not save settings",
        },
        form: {
          businessName: {
            label: "Business name",
            hint: "Appears on every generated quote.",
            placeholder: "Northline Painting Co.",
          },
          defaultCurrency: {
            label: "Default currency",
            hint: "ISO code used for pricing.",
            placeholder: "USD",
          },
          businessEmail: {
            label: "Business email",
            hint: "Used for quote headers and follow-up.",
            placeholder: "quotes@northline.co",
          },
          businessPhone: {
            label: "Business phone",
            hint: "Shown to prospects on the quote.",
            placeholder: "(555) 246-8100",
          },
          businessAddress: {
            label: "Business address",
            hint: "Multi-line address block for the quote header.",
            placeholder: "410 River Street\nSuite 8\nPortland, OR 97204",
          },
          defaultLocale: {
            label: "Default language",
            hint: "Used for new quotes and the future assistant.",
          },
          defaultTaxRate: {
            label: "Default tax rate",
            hint: "Enter a percentage like 20 for 20%.",
            placeholder: "20",
          },
          defaultValidityDays: {
            label: "Quote validity",
            hint: "How long a draft should remain valid.",
            placeholder: "30",
          },
          defaultPaymentTerms: {
            label: "Payment terms",
            hint: "Inserted into quote terms until a niche-specific template exists.",
            placeholder: "Payment due on receipt.",
          },
        },
        summary: {
          title: "Defaults snapshot",
          taxDefault: "Tax default",
          quoteValidity: "Quote validity",
          validityDays: "{{count}} days",
          currency: "Currency",
          language: "Language",
        },
        assistantInputs: {
          title: "Quote assistant inputs",
          contactDetails: "Contact details",
          phone: "Phone",
          address: "Address",
        },
        backend: {
          title: "Backend status",
          persistenceLabel: "Persistence",
          persistenceValue: "SQLite",
          persistenceDescription:
            "Defaults are stored in the backend settings row and reused across sessions.",
          lastSaved: "Last saved",
          nextUnlock: "Next unlock",
          nextUnlockDescription:
            "New quotes now inherit these language and business defaults.",
        },
      },
      quote: {
        errors: {
          missingId: "Quote ID is missing",
          load: "Could not load quote",
          save: "Could not save quote",
        },
        loading: "Loading quote workspace...",
        openErrorTitle: "Could not open quote",
        backToDashboard: "Back to dashboard",
        workspaceShell: "Workspace shell",
        assistantTitle: "Quote assistant",
        assistantDescription:
          "Chat here with the real model to enrich the draft and apply structured quote updates.",
        lastSaved: "Last saved",
        validUntil: "Valid until",
        totalsPreview: "Totals preview",
        chat: {
          hintReady: "Chat with the assistant to enrich this saved draft.",
          hintSaveFirst: "Save your manual edits before sending a message to the assistant.",
          emptyTitle: "Start the conversation",
          emptyDescription:
            "Describe the project, the customer request, or the missing details. The assistant will either ask a focused question or update the draft.",
          inputPlaceholder:
            "Example: I need a quote for repainting two meeting rooms and the reception hall.",
          send: "Send",
          sending: "Thinking...",
          errors: {
            send: "Could not send the message to the assistant",
          },
          actions: {
            askQuestion: "Question",
            updateQuote: "Draft updated",
          },
          roles: {
            assistant: "AI",
            owner: "Owner",
          },
        },
        subtotal: "Subtotal",
        tax: "Tax ({{value}})",
        total: "Total",
        pricingReady:
          "All line items are priced and ready for the next phase of automation.",
        pricingIncomplete:
          "At least one line item still needs pricing or review before the quote is fully ready.",
        editorEyebrow: "Quote editor",
        editorTitle: "Shape the draft before AI starts helping",
        back: "Back",
        saveQuote: "Save quote",
        saving: "Saving...",
        savingQuote: "Saving quote...",
        defaultTax: "{{value}} default tax",
        sections: {
          customerBasics: "Customer and quote basics",
          scopeAndTerms: "Scope and terms",
          lineItemsAndPricing: "Line items and pricing",
        },
        fields: {
          quoteTitle: {
            label: "Quote title",
            hint: "Short label shown on lists and previews.",
            placeholder: "Office repainting quote",
          },
          status: {
            label: "Status",
            hint: "Keep drafts editable until they are ready to share.",
          },
          customerName: {
            label: "Customer name",
            hint: "Primary contact for the quote.",
            placeholder: "Morgan Lee",
          },
          company: {
            label: "Company",
            hint: "Optional company or site name.",
            placeholder: "Harbor Studio",
          },
          email: {
            label: "Email",
            hint: "Useful for quote follow-up and later send flows.",
            placeholder: "morgan@harbor.studio",
          },
          phone: {
            label: "Phone",
            hint: "Optional but helpful for quick clarifications.",
            placeholder: "(555) 901-2233",
          },
          address: {
            label: "Address",
            hint: "Customer or job site address.",
            placeholder: "410 River Street\nSuite 8\nPortland, OR 97204",
          },
          locale: {
            label: "Quote language",
            hint: "Will be used by the future assistant and quote copy.",
          },
          currency: {
            label: "Currency",
            hint: "ISO code used for every line item.",
            placeholder: "USD",
          },
          validUntil: {
            label: "Valid until",
            hint: "The quote remains open until this date.",
          },
          jobSummary: {
            label: "Job summary",
            hint: "What the work actually covers.",
            placeholder: "Interior repainting for a small office with two meeting rooms.",
          },
          assumptions: {
            label: "Assumptions",
            hint: "Use this for dependencies, access constraints, or exclusions.",
            placeholder: "Client provides clear access to the site during working hours.",
          },
          paymentTerms: {
            label: "Payment terms",
            hint: "Loaded from settings but still editable per quote.",
            placeholder: "Payment due on receipt.",
          },
          internalNotes: {
            label: "Internal notes",
            hint: "Visible only to you in the workspace for now.",
            placeholder: "Follow up with material lead time before sending.",
          },
          description: {
            label: "Description",
            hint: "Customer-facing line item label.",
            placeholder: "Interior wall preparation and painting",
          },
          quantity: {
            label: "Quantity",
            hint: "Supports decimals when needed.",
            placeholder: "1",
          },
          unit: {
            label: "Unit",
            hint: "Examples: job, day, room.",
            placeholder: "job",
          },
          unitPrice: {
            label: "Unit price",
            hint: "Leave blank to keep it in review.",
            placeholder: "1500",
          },
        },
        actions: {
          addLineItem: "Add line item",
          remove: "Remove",
          reload: "Reload",
          print: "Print",
        },
        lineItems: {
          emptyTitle: "No line items yet",
          emptyDescription:
            "Add at least one priced line item so totals can be calculated and the quote can move forward.",
          needsReview: "Needs review",
          lineTotalPreview: "Line total preview",
        },
        review: {
          title: "Review before print",
          readyToPrint: "This quote is ready to print as-is.",
          needsAttention_one: "{{count}} line item still needs review.",
          needsAttention_other: "{{count}} line items still need review.",
          printHint: "Printing uses the latest saved quote and keeps any review flags visible.",
          saveBeforePrint: "Save your latest edits before printing so backend totals remain the source of truth.",
          untitledLineItem: "Untitled line item {{index}}",
          reasons: {
            missingPrice: "No unit price has been set yet.",
            markedForReview: "This line item is explicitly marked for review.",
          },
        },
        print: {
          from: "Issued by",
          preparedFor: "Prepared for",
          issuedOn: "Created on",
          quantity: "Qty",
          unitPrice: "Unit price",
          lineTotal: "Line total",
          assumptions: "Assumptions",
          paymentTerms: "Payment terms",
          internalNotes: "Internal notes",
          notPriced: "Needs pricing",
          reviewNoticeTitle: "Incomplete pricing",
          reviewNoticeDescription_one: "One line item still needs review or pricing before final send.",
          reviewNoticeDescription_other: "{{count}} line items still need review or pricing before final send.",
        },
        footer: {
          saved: "Quote saved. Backend totals are now up to date.",
          idle: "Save the draft after edits so the backend stays authoritative.",
          backendOwned: "Backend-controlled totals and validity",
        },
      },
    },
  },
} as const
