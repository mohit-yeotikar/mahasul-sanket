import { Suspense } from "react";
import { NewTicketForm } from "@/features/tickets/NewTicketForm";

export const metadata = { title: "नवीन तिकीट | महसूल संकेत" };

export default function NewTicketPage() {
  return (
    <Suspense>
      <NewTicketForm />
    </Suspense>
  );
}
