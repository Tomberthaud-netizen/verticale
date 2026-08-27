import EmailReglagesForm from "./EmailReglagesForm";

export default function EmailPanel({ objet, corps }: { objet: string; corps: string }) {
  return (
    <div className="flex flex-col gap-6">
      <EmailReglagesForm objetActuel={objet} corpsActuel={corps} />
    </div>
  );
}
