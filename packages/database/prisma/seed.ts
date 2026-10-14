import {
  PrismaClient,
  GlobalRole,
  WorkspaceRole,
  JobStatus,
  SubscriptionTier,
  SubscriptionStatus,
  JobRemoteType,
  JobEmploymentType,
  JobExperienceLevel,
} from '../src/index';

const db = new PrismaClient();

async function main() {
  console.log('🌱 Starting Executive Match database seed...');

  // 1. Super Admin
  const adminUser = await db.user.upsert({
    where: { email: 'admin@executive-match.internal' },
    update: { globalRole: GlobalRole.SUPER_ADMIN, emailVerified: new Date() },
    create: {
      email: 'admin@executive-match.internal',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$dGVzdGhhc2g', // Mock argon2id hash
      globalRole: GlobalRole.SUPER_ADMIN,
      emailVerified: new Date(),
      profile: {
        create: {
          displayName: 'Platform Operations Admin',
        },
      },
    },
  });
  console.log(`✓ Admin user: ${adminUser.email}`);

  // 2. Employer Owner User
  const employerUser = await db.user.upsert({
    where: { email: 'recruiter@horizon.example.com' },
    update: { emailVerified: new Date() },
    create: {
      email: 'recruiter@horizon.example.com',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$dGVzdGhhc2g',
      emailVerified: new Date(),
      profile: {
        create: {
          displayName: 'Elena Rostova',
        },
      },
    },
  });

  // 3. Workspace & Company
  const workspace = await db.workspace.upsert({
    where: { slug: 'horizon-search' },
    update: {},
    create: {
      slug: 'horizon-search',
      name: 'Horizon Executive Search',
      memberships: {
        create: {
          userId: employerUser.id,
          role: WorkspaceRole.OWNER,
        },
      },
      subscription: {
        create: {
          tier: SubscriptionTier.ENTERPRISE,
          status: SubscriptionStatus.ACTIVE,
          activeJobLimit: 100,
          candidateSearchLimit: 5000,
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        },
      },
    },
  });

  const company = await db.company.upsert({
    where: { slug: 'horizon-ventures' },
    update: {},
    create: {
      workspaceId: workspace.id,
      slug: 'horizon-ventures',
      name: 'Horizon Ventures',
      website: 'https://horizonventures.example.com',
      industry: 'Venture Capital & Executive Search',
      size: '50-200',
      location: 'San Francisco, CA',
    },
  });
  console.log(`✓ Workspace: ${workspace.name} (${workspace.slug}) & Company: ${company.name}`);

  // 4. Job Requisitions
  const vpEngJob = await db.job.upsert({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: 'vp-engineering',
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      slug: 'vp-engineering',
      title: 'VP of Engineering',
      department: 'Engineering',
      description: 'Lead engineering organization through Series C scaling. Direct architecture, distributed systems, and team leadership.',
      location: 'San Francisco, CA',
      remoteType: JobRemoteType.HYBRID,
      employmentType: JobEmploymentType.FULL_TIME,
      experienceLevel: JobExperienceLevel.EXECUTIVE,
      minSalary: 250000,
      maxSalary: 320000,
      currency: 'USD',
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(),
      skills: {
        create: [
          { name: 'TypeScript', isRequired: true },
          { name: 'Distributed Systems', isRequired: true },
          { name: 'Node.js', isRequired: true },
          { name: 'Team Leadership', isRequired: true },
          { name: 'PostgreSQL', isRequired: false },
        ],
      },
    },
  });

  const cpoJob = await db.job.upsert({
    where: {
      workspaceId_slug: {
        workspaceId: workspace.id,
        slug: 'chief-product-officer',
      },
    },
    update: {},
    create: {
      workspaceId: workspace.id,
      slug: 'chief-product-officer',
      title: 'Chief Product Officer',
      department: 'Product',
      description: 'Define multi-product vision, customer discovery, pricing mechanics, and roadmapping across enterprise lines.',
      location: 'New York, NY',
      remoteType: JobRemoteType.REMOTE,
      employmentType: JobEmploymentType.FULL_TIME,
      experienceLevel: JobExperienceLevel.EXECUTIVE,
      minSalary: 270000,
      maxSalary: 350000,
      currency: 'USD',
      status: JobStatus.PUBLISHED,
      publishedAt: new Date(),
      skills: {
        create: [
          { name: 'Product Strategy', isRequired: true },
          { name: 'B2B SaaS', isRequired: true },
          { name: 'Roadmapping', isRequired: true },
          { name: 'User Experience', isRequired: false },
        ],
      },
    },
  });
  console.log(`✓ Requisitions: ${vpEngJob.title}, ${cpoJob.title}`);

  // 5. Candidate Profile
  const candidateUser = await db.user.upsert({
    where: { email: 'candidate.alex@example.com' },
    update: { emailVerified: new Date() },
    create: {
      email: 'candidate.alex@example.com',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$dGVzdGhhc2g',
      emailVerified: new Date(),
      profile: {
        create: {
          displayName: 'Alex Rivera',
        },
      },
      candidate: {
        create: {
          headline: 'Senior Engineering Director & Distributed Systems Architect',
          bio: '14+ years scaling cloud platforms, microservices architecture, and high-velocity engineering organizations.',
          location: 'San Francisco, CA',
          yearsOfExperience: 14,
          searchVisible: true,
          skills: {
            create: [
              { name: 'TypeScript', yearsOfExperience: 8, isPrimary: true },
              { name: 'Distributed Systems', yearsOfExperience: 10, isPrimary: true },
              { name: 'Node.js', yearsOfExperience: 8, isPrimary: true },
              { name: 'Team Leadership', yearsOfExperience: 6, isPrimary: true },
            ],
          },
          experiences: {
            create: [
              {
                title: 'Director of Platform Engineering',
                companyName: 'CloudScale Inc.',
                location: 'San Francisco, CA',
                startDate: new Date('2021-01-01'),
                isCurrent: true,
                description: 'Managed 45 engineers across core infrastructure, microservices, and database platforms.',
              },
            ],
          },
        },
      },
    },
  });
  console.log(`✓ Candidate: ${candidateUser.email}`);

  console.log('✅ Executive Match database seed finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error executing database seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
