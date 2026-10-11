import { BrowseView } from "@/components/browse/browse-view";
import { SiteHeader } from "@/components/browse/site-header";
import { getReferenceData } from "@/lib/reference-data";

export default async function BrowsePage() {
  const reference = await getReferenceData();
  return (
    <>
      <SiteHeader />
      <BrowseView reference={reference} />
    </>
  );
}
