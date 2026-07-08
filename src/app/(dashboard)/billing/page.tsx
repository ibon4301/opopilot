import type { Metadata } from "next";
import { CreditCard } from "lucide-react";

import { PagePlaceholder } from "@/components/shared/page-placeholder";

export const metadata: Metadata = {
  title: "Billing",
};

export default function BillingPage() {
  return (
    <PagePlaceholder
      icon={CreditCard}
      title="Billing"
      description="Tu plan, facturas y métodos de pago."
      hint="Aquí gestionarás tu suscripción cuando lancemos los planes de pago."
    />
  );
}
