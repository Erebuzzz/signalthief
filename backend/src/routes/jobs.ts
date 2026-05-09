import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type {
  CreateJobRequest,
  CreateJobResponse,
  JobStatusResponse,
} from '../../../shared/types.js';
import { ApiError } from '../lib/errors.js';
import { logger } from '../lib/logger.js';
import { createJob, getJob, listJobs, updateJobState } from '../services/job-store.js';

type JobParams = { id: string };

export async function jobRoutes(app: FastifyInstance) {
  app.post('/api/jobs', async (
    request: FastifyRequest<{ Body: CreateJobRequest }>,
    reply: FastifyReply,
  ) => {
    try {
      if (!request.body?.kind) {
        throw new ApiError(400, 'Job kind is required');
      }

      if (!request.body.input?.url) {
        throw new ApiError(400, 'Job input URL is required');
      }

      const job = createJob({
        ...request.body,
        executionTarget: request.body.executionTarget ?? 'local-desktop',
      });

      logger.info('Job accepted by backend orchestrator', {
        jobId: job.id,
        kind: job.kind,
        executionTarget: job.executionTarget,
        deviceId: job.deviceId,
      });

      return reply.status(202).send({ success: true, job } as CreateJobResponse);
    } catch (err: any) {
      if (err instanceof ApiError) {
        return reply.status(err.statusCode).send({ success: false, error: err.message } as CreateJobResponse);
      }

      logger.error('Failed to create job', err);
      return reply.status(500).send({ success: false, error: 'Failed to create job' } as CreateJobResponse);
    }
  });

  app.get('/api/jobs', async () => ({
    success: true,
    jobs: listJobs(),
  }));

  app.get('/api/jobs/:id', async (
    request: FastifyRequest<{ Params: JobParams }>,
    reply: FastifyReply,
  ) => {
    const job = getJob(request.params.id);
    if (!job) {
      return reply.status(404).send({ success: false, error: 'Job not found' } as JobStatusResponse);
    }

    return reply.send({ success: true, job } as JobStatusResponse);
  });

  app.post('/api/jobs/:id/cancel', async (
    request: FastifyRequest<{ Params: JobParams }>,
    reply: FastifyReply,
  ) => {
    const job = updateJobState(request.params.id, 'canceled', {
      progress: 0,
      error: {
        kind: 'canceled',
        message: 'Job was canceled by the user',
        retryable: false,
      },
    });

    if (!job) {
      return reply.status(404).send({ success: false, error: 'Job not found' } as JobStatusResponse);
    }

    return reply.send({ success: true, job } as JobStatusResponse);
  });
}
