'use client';

import { Card, Button, Badge } from '@executive-match/ui';
import type { CandidateInterviewItem } from '@/lib/api';

export function CandidateInterviews({
  initialInterviews,
}: {
  initialInterviews: CandidateInterviewItem[];
}) {
  return (
    <div className="space-y-6">
      {initialInterviews.length === 0 ? (
        <Card className="p-12 text-center border-dashed space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto text-xl">
            📅
          </div>
          <h3 className="font-bold text-foreground text-lg">No interviews scheduled yet</h3>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            When recruiters advance your applications to the interview stage, scheduled video calls,
            screenings, and panel rounds will appear here with calendar invitations and call links.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {initialInterviews.map((item) => {
            const isScheduled = item.status === 'SCHEDULED';
            return (
              <Card
                key={item.id}
                variant="outline"
                className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-5 hover:border-primary/40 transition-colors"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">{item.title}</h3>
                    <Badge variant="neutral">{item.type}</Badge>
                    <Badge variant={isScheduled ? 'accent' : 'neutral'}>{item.status}</Badge>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Role:{' '}
                    <strong className="text-foreground">{item.application.job.title}</strong> • At{' '}
                    <span className="font-semibold text-primary">
                      {item.application.job.workspace?.company?.name || item.application.job.company?.name || 'Company'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/80 pt-1">
                    <span>
                      🕒{' '}
                      {new Date(item.scheduledAt).toLocaleString(undefined, {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      ({item.durationMinutes} min, {item.timezone})
                    </span>
                  </div>

                  {/* Preparation Tips */}
                  <div className="mt-2 p-3 rounded-md bg-muted/40 border border-border text-[11px] text-muted-foreground space-y-1">
                    <span className="font-semibold text-foreground">Preparation Guideline:</span>
                    <p>
                      Please test your camera, microphone, and internet connection 5 minutes prior to
                      the scheduled start. Have your resume and portfolio handy for discussion.
                    </p>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-2.5 shrink-0 pt-2 md:pt-0">
                  {item.location && isScheduled && (
                    <a
                      href={item.location.startsWith('http') ? item.location : `https://${item.location}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Button variant="primary" size="sm" className="text-xs">
                        Join Video Call ↗
                      </Button>
                    </a>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
