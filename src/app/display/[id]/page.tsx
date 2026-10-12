import DisplayClient from "./DisplayClient";

export default async function DisplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DisplayClient id={id} />;
}
