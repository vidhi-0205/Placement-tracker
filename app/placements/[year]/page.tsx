import PlacementPage from "./PlacementPage";

export default async function PlacementRoute({ params }: { params: Promise<{ year: string }> }) {
  const { year } = await params;
  return <PlacementPage year={year} />;
}
