import { Task, EMEAContact, APDeal } from '../types.ts';

export const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    title: 'Prepare urgent contract addendum for AP Fintech renewal',
    description: 'Account Partner requested custom data residency SLA clauses before Thursday EOD. Flagged as high urgency due to imminent renewal date.',
    priority: 'Critical',
    status: 'In Progress',
    category: 'Sales / AP Deals',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    dueTime: '17:00',
    assignee: 'Marcus Vance (CX Lead)',
    source: 'voice',
    urgencyKeywords: ['immediately', 'critical', 'urgent'],
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'task-2',
    title: 'Sync with EMEA regional support lead on webhook timeouts',
    description: 'Retrieve team contacts from EMEA notification bot and verify Frankfurt cluster failover configuration.',
    priority: 'High',
    status: 'To Do',
    category: 'EMEA Outreach',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    dueTime: '14:30',
    assignee: 'Elena Rostova',
    source: 'emea-bot',
    urgencyKeywords: ['asap', 'high priority'],
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: 'task-3',
    title: 'Review Q3 Executive Summary from Teams Operations Standup',
    description: 'Extracted action items from all-hands meeting script: compile headcount forecast and platform uptime metrics.',
    priority: 'Medium',
    status: 'To Do',
    category: 'Operations',
    dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    assignee: 'David Chen',
    source: 'meeting-script',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'task-4',
    title: 'Audit AP Partner Deal pipeline metrics for CX Renewal Bot',
    description: 'Cross-check 5 deals linked to Account Partners closing this quarter against CRM milestones.',
    priority: 'Medium',
    status: 'Completed',
    category: 'Sales / AP Deals',
    dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    dueTime: '12:00',
    assignee: 'Sophia Laurent',
    source: 'cx-bot',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'task-5',
    title: 'Send quarterly security patch notice to Munich customer cluster',
    description: 'Mandatory compliance update scheduled for Friday night maintenance window.',
    priority: 'Low',
    status: 'Completed',
    category: 'Engineering',
    dueDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    assignee: 'Liam O’Connor',
    source: 'manual',
    createdAt: new Date(Date.now() - 3600000 * 72).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
  },
  {
    id: 'task-6',
    title: 'Follow up on missed SLA notification with Nordic Telecom AP',
    description: 'Response deadline elapsed without customer confirmation. Ticket escalated to leadership.',
    priority: 'Critical',
    status: 'Missed / Late',
    category: 'Client Success',
    dueDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    dueTime: '09:00',
    assignee: 'Marcus Vance (CX Lead)',
    source: 'meeting-script',
    urgencyKeywords: ['blocker', 'critical'],
    createdAt: new Date(Date.now() - 3600000 * 96).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
    missedAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

export const SAMPLE_MEETINGS = [
  {
    title: 'Google Meet: CX & AP Deal Renewal Sync',
    platform: 'Google Meet',
    context: 'Quarterly review of Account Partner renewal pipeline & SLA obligations.',
    script: `Sarah Jenkins (CX VP): Good morning team. Let's get straight to the AP renewal list. The Nordic Telecom renewal is in 10 days, and Account Partner Brian flagged that their procurement team needs the revised ISO security addendum immediately.
Marcus Vance: I'm on it Sarah. I will draft the ISO security addendum and send it over before 3 PM today. This is critical because they won't sign without it.
Brian Hall (Account Partner): Thanks Marcus. Also, we noticed the EMEA notification bot experienced two latency alerts yesterday. Elena, can you retrieve the EMEA team contacts and investigate the Frankfurt cluster?
Elena Rostova: Yes, I will pull team contacts from the EMEA Notification Bot and run a diagnostic on the Frankfurt API gateway ASAP. I'll post the findings in the CX channel by EOD.
Sarah Jenkins: Excellent. Last item: Sophia, please track all active deals linked to APs with ARR over $250k and compile the risk matrix for next Monday's board review.
Sophia Laurent: Understood, I'll export the CX Renewal Bot deal sheet and prepare the priority summary.
Sarah Jenkins: Perfect, meeting adjourned.`,
  },
  {
    title: 'Microsoft Teams: EMEA Operations & Rapid Escalation',
    platform: 'Microsoft Teams',
    context: 'Cross-functional engineering and regional on-call response team.',
    script: `Liam O'Connor (DevOps Lead): Welcome everyone. We had a brief outage in London Zone 2 this morning. The backup routed correctly, but the failover logs show slow synchronization.
David Chen: I will investigate the database replication lag immediately. It's a high priority blocker for our European bank tenants.
Liam O'Connor: Thank you David. Also, our support desk received 4 tickets regarding client webhook notifications failing in Paris and Berlin.
Elena Rostova: I'm checking the EMEA notification bot integration now. We need to ping the local on-call engineers in Paris and Berlin to verify their endpoint health.
Marcus Vance: Please make sure to update the status page as soon as possible so customers are aware.
Liam O'Connor: Action item assigned: Marcus to publish customer communication notice within 30 minutes. Let's reconvene at 2 PM if not resolved.`,
  },
  {
    title: 'Zoom: Executive Client Deliverables & Strategy',
    platform: 'Zoom',
    context: 'Weekly leadership sync on customer commitments and deliverables.',
    script: `Jessica Taylor (Product Director): Quick round on major client commitments this sprint.
Tom Becker: The automated task export feature is ready for QA. I need QA sign-off by Wednesday morning so we can deploy to staging.
Jessica Taylor: Great. What about the voice capture transcription latency?
Tom Becker: We optimized the audio parser using browser microphone streaming and Gemini 3.8 Flash. Accuracy is up 40% and urgency word detection is working seamlessly.
Jessica Taylor: Outstanding. Let's ensure the Chrome Side Panel layout remains compact and fully accessible.
Sarah Jenkins: I will conduct an end-to-end user audit of the Side Panel and Popup interfaces before Friday.`,
  },
];

export const EMEA_TEAM_CONTACTS: EMEAContact[] = [
  {
    id: 'emea-1',
    name: 'Elena Rostova',
    role: 'EMEA Regional Operations Lead',
    region: 'United Kingdom / London (UTC+1)',
    email: 'elena.rostova@enterprise.internal',
    timezone: 'GMT / BST',
    onCallStatus: 'On Call',
    specialization: 'Incident Escalation, Infrastructure & Bot Routing',
  },
  {
    id: 'emea-2',
    name: 'Klaus Weber',
    role: 'Central Europe Solutions Architect',
    region: 'Germany / Frankfurt (UTC+2)',
    email: 'klaus.weber@enterprise.internal',
    timezone: 'CEST',
    onCallStatus: 'Available',
    specialization: 'Frankfurt Cluster, Data Residency, Security Addendums',
  },
  {
    id: 'emea-3',
    name: 'Amira Benali',
    role: 'Middle East & North Africa Partner Lead',
    region: 'UAE / Dubai (UTC+4)',
    email: 'amira.benali@enterprise.internal',
    timezone: 'GST',
    onCallStatus: 'Available',
    specialization: 'Enterprise AP Partnerships, Telecom Deals',
  },
  {
    id: 'emea-4',
    name: 'Claire Dupont',
    role: 'Southern Europe CX Manager',
    region: 'France / Paris (UTC+2)',
    email: 'claire.dupont@enterprise.internal',
    timezone: 'CEST',
    onCallStatus: 'In Meeting',
    specialization: 'Customer Success & Contract Renewals',
  },
  {
    id: 'emea-5',
    name: 'Sipho Ndlovu',
    role: 'Sub-Saharan Africa Technical Lead',
    region: 'South Africa / Johannesburg (UTC+2)',
    email: 'sipho.ndlovu@enterprise.internal',
    timezone: 'SAST',
    onCallStatus: 'Available',
    specialization: 'Payment Integrations, Mobile API Gateways',
  },
];

export const AP_LINKED_DEALS: APDeal[] = [
  {
    id: 'deal-101',
    dealName: 'Nordic Telecom Enterprise Core',
    accountPartner: 'Brian Hall (Telco AP)',
    arrValue: 820000,
    renewalDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
    health: 'Critical Risk',
    keyContacts: ['CTO Astrid Lind', 'Procurement Dir. Karl Jansen'],
    pendingActionsCount: 3,
  },
  {
    id: 'deal-102',
    dealName: 'Fintech Global Cross-Border Gateway',
    accountPartner: 'Sophia Laurent (Banking AP)',
    arrValue: 450000,
    renewalDate: new Date(Date.now() + 86400000 * 18).toISOString().split('T')[0],
    health: 'At Risk',
    keyContacts: ['VP Engineering Mark R.', 'Head of Ops Denise C.'],
    pendingActionsCount: 2,
  },
  {
    id: 'deal-103',
    dealName: 'EuroLogistics Freight Intelligence',
    accountPartner: 'Brian Hall (Logistics AP)',
    arrValue: 320000,
    renewalDate: new Date(Date.now() + 86400000 * 35).toISOString().split('T')[0],
    health: 'On Track',
    keyContacts: ['Logistics VP Hans Gruber', 'Fleet Director Eva Meyer'],
    pendingActionsCount: 1,
  },
  {
    id: 'deal-104',
    dealName: 'Alliance Healthcare Cloud Record Sync',
    accountPartner: 'Amira Benali (Health AP)',
    arrValue: 640000,
    renewalDate: new Date(Date.now() + 86400000 * 60).toISOString().split('T')[0],
    health: 'On Track',
    keyContacts: ['Chief Medical Officer Dr. Aris', 'IT Dir. Samira K.'],
    pendingActionsCount: 0,
  },
];
