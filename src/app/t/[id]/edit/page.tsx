import TimelineEditor from "@/components/TimelineEditor";

export default async function EditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  const { id } = await params;
  const { key } = await searchParams;
  return <TimelineEditor timelineId={id} urlKey={key} />;
}
