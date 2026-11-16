import { TaskStatus } from '../tasks/task-status';

export const DEMO_PASSWORD = 'Demo1234';

type DemoTask = {
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string | null;
};

type DemoUser = {
  name: string;
  email: string;
  password: string;
  projects: Array<{
    title: string;
    description: string;
    tasks: DemoTask[];
  }>;
};

export const demoUsers: DemoUser[] = [
  {
    name: 'Ava Shah',
    email: 'ava@demo.com',
    password: DEMO_PASSWORD,
    projects: [
      {
        title: 'Studio site relaunch',
        description:
          'Replace the marketing site and move the journal onto the new stack.',
        tasks: [
          {
            title: 'Audit current pages',
            description: 'List every public URL and note what stays.',
            status: TaskStatus.Done,
            dueDate: '2026-10-02',
          },
          {
            title: 'Rewrite homepage',
            description: 'Lead with the exhibition, not the studio history.',
            status: TaskStatus.InProgress,
            dueDate: '2026-11-20',
          },
          {
            title: 'Collect photography',
            description: 'Ask the photographer for the October set.',
            status: TaskStatus.Todo,
            dueDate: '2026-11-01',
          },
          {
            title: 'Launch checklist',
            description: 'DNS, redirects, and a quiet announcement.',
            status: TaskStatus.Todo,
            dueDate: null,
          },
        ],
      },
      {
        title: 'Spring exhibition',
        description:
          'Checklist for the April show, from lenders to wall labels.',
        tasks: [
          {
            title: 'Confirm lender list',
            description: '',
            status: TaskStatus.Todo,
            dueDate: '2026-12-01',
          },
          {
            title: 'Draft wall text',
            description: 'Keep each label under 80 words.',
            status: TaskStatus.InProgress,
            dueDate: '2026-11-10',
          },
          {
            title: 'Print labels',
            description: '',
            status: TaskStatus.Done,
            dueDate: '2026-11-12',
          },
        ],
      },
    ],
  },
  {
    name: 'Noah Iyer',
    email: 'noah@demo.com',
    password: DEMO_PASSWORD,
    projects: [
      {
        title: 'Mobile beta',
        description: 'Invite list and the bugs that block a wider release.',
        tasks: [
          {
            title: 'Fix offline queue',
            description: '',
            status: TaskStatus.InProgress,
            dueDate: '2026-11-18',
          },
          {
            title: 'Send tester notes',
            description: '',
            status: TaskStatus.Todo,
            dueDate: '2026-10-30',
          },
        ],
      },
      {
        title: 'Studio move',
        description: 'Pack the archive before the lease ends.',
        tasks: [
          {
            title: 'Label archive boxes',
            description: '',
            status: TaskStatus.Todo,
            dueDate: '2026-12-15',
          },
          {
            title: 'Book the van',
            description: '',
            status: TaskStatus.Done,
            dueDate: '2026-11-05',
          },
        ],
      },
    ],
  },
];
