import { notFound } from 'next/navigation';
import { getJobApplications, getPublicJob } from '@/lib/api';
import { AtsPipelineBoard } from '@/components/ats-pipeline-board';

export default async function WorkspaceJobAtsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; jobSlug: string }>;
}) {
  const { workspaceSlug, jobSlug } = await params;
  const job = await getPublicJob(jobSlug);
  if (!job) {
    notFound();
  }
  const { items: applications } = await getJobApplications(workspaceSlug, jobSlug);

  return (
    <main className="container simple-page">
      <AtsPipelineBoard
        workspaceSlug={workspaceSlug}
        jobSlug={jobSlug}
        jobTitle={job.title}
        initialApplications={applications}
      />
    </main>
  );
}
