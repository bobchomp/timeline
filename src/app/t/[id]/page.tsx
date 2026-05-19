import TimelineViewer from "@/components/TimelineViewer";

export default async function ViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TimelineViewer timelineId={id} />;
}
