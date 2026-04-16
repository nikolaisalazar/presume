import type { Resume } from './types'

export const DEFAULT_RESUME: Resume = {
  name: 'Alex Johnson',
  contact: [
    '(555) 867-5309',
    'alex.johnson@email.com',
    'linkedin.com/in/alexjohnson',
    'github.com/alexjohnson',
  ],
  sections: [
    {
      title: 'Education',
      entries: [
        {
          title: 'Bachelor of Science in Computer Science, GPA: 3.7',
          subtitle: 'University of Texas at Austin',
          location: 'Austin, TX',
          dateRange: 'Aug. 2019 – May 2023',
          bullets: [],
        },
      ],
    },
    {
      title: 'Experience',
      entries: [
        {
          title: 'Software Engineer',
          subtitle: 'Acme Technologies',
          location: 'San Francisco, CA',
          dateRange: 'Jul. 2023 – Present',
          bullets: [
            'Architected and deployed microservices infrastructure that reduced average API response latency by 35%',
            'Collaborated with product and design teams to ship four major features serving over two million active users',
            'Automated CI/CD pipeline with GitHub Actions cutting average deployment time from 45 minutes to under 8',
          ],
        },
        {
          title: 'Software Engineering Intern',
          subtitle: 'Bright Solutions Inc.',
          location: 'Austin, TX',
          dateRange: 'May 2022 – Aug. 2022',
          bullets: [
            'Built a real-time dashboard with React and WebSockets enabling operations staff to monitor system metrics',
            'Refactored legacy authentication module improving test coverage from 22% to 91% across all critical paths',
            'Implemented a data export feature in TypeScript that processed batch jobs for over 10,000 customer records',
          ],
        },
      ],
    },
    {
      title: 'Projects',
      entries: [
        {
          title: 'CodeCollab',
          subtitle: 'TypeScript, React, Node.js, WebRTC, PostgreSQL',
          location: '',
          dateRange: 'Jan. 2023 – Apr. 2023',
          bullets: [
            'Designed a real-time collaborative code editor supporting simultaneous editing for up to 20 concurrent users',
            'Integrated WebRTC peer connections with a Node.js signaling server achieving sub-100ms latency for sessions',
            'Deployed the app on AWS EC2 with auto-scaling policies that handled traffic spikes of up to 500 requests/sec',
          ],
        },
        {
          title: 'SmartBudget',
          subtitle: 'Python, FastAPI, React, PostgreSQL, Plaid API',
          location: '',
          dateRange: 'Aug. 2022 – Dec. 2022',
          bullets: [
            'Built a personal finance tracker using the Plaid API to automatically categorize bank transactions each day',
            'Trained a scikit-learn classifier achieving 88% accuracy predicting overspending trends by expense category',
            'Containerized all services with Docker Compose streamlining local development and enabling one-command deploys',
          ],
        },
      ],
    },
    {
      title: 'Technical Skills',
      entries: [
        {
          title: '',
          subtitle: '',
          location: '',
          dateRange: '',
          bullets: [
            'Languages: TypeScript, Python, Java, Go, SQL, Bash, HTML/CSS — proficient across all listed technologies',
            'Frameworks & Tools: React, Node.js, FastAPI, Docker, Kubernetes, PostgreSQL, Redis, AWS, GitHub Actions',
            'Practices: RESTful API design, microservices architecture, CI/CD, agile development, test-driven development',
          ],
        },
      ],
    },
  ],
}
