interface Props {
  project: string;
  projectName: string;
  version: string;
  isLatestVersion: boolean;
}

export function PagefindMetadata({
  project,
  projectName,
  version,
  isLatestVersion,
}: Props) {
  // If not latest version, exclude from search entirely
  if (!isLatestVersion) {
    return <div data-pagefind-ignore="page" hidden />;
  }

  return (
    <>
      <div data-pagefind-filter={`project:${project}`} hidden />
      <div data-pagefind-meta={`projectName:${projectName}`} hidden />
      <div data-pagefind-meta={`projectId:${project}`} hidden />
    </>
  );
}
