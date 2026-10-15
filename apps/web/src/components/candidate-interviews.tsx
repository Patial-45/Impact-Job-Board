'use client';

import { Card, Button, Badge } from '@executive-match/ui';
import type { CandidateInterviewItem } from '@/lib/api';
import {
  Calendar,
  Clock,
  Video,
  Building2,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export function CandidateInterviews({
  initialInterviews,
}: {
  initialInterviews: CandidateInterviewItem[];
}) {
  return (
    <div className="space-y-6">
      {initialInterviews.length === 0 ? (
        <Card className="card-3d p-12 text-center border-dashed border-border/80 space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-xs">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-foreground text-lg">No interviews scheduled yet</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              When recruiters advance your applications to the interview stage, scheduled video calls,
              technical screenings, and panel rounds will appear here with calendar invitations and secure links.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {initialInterviews.map((item) => {
            const isScheduled = item.status === 'SCHEDULED';
            return (
              <Card
                key={item.id}
                className="card-3d p-6 flex flex-col md:flex-row md:items-start justify-between gap-5 hover:border-primary/40 transition-all shadow-sm"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-foreground">{item.title}</h3>
                    <Badge variant="neutral">{item.type}</Badge>
                    <Badge variant={isScheduled ? 'accent' : 'neutral'}>{item.status}</Badge>
                  </div>

                  <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-semibold text-primary">
                        {item.application.job.workspace?.company?.name || item.application.job.company?.name || 'Company'}
                      </span>
                    </span>
                    <span>•</span>
                    <span>
                      Target Role: <strong className="text-foreground">{item.application.job.title}</strong>
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/80 pt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted/60 font-medium">
                      <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>
                        {new Date(item.scheduledAt).toLocaleString(undefined, {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        ({item.durationMinutes} min, {item.timezone})
                      </span>
                    </span>
                  </div>

                  {/* Preparation Tips */}
                  <div className="mt-2 p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground space-y-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Preparation Guideline</span>
                    </div>
                    <p className="leading-relaxed">
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
                      <Button variant="primary" size="sm" className="btn-3d text-xs font-semibold gap-1.5">
                        <Video className="w-3.5 h-3.5" />
                        <span>Join Video Call</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
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
