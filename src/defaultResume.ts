import type { Resume } from './types'

export const DEFAULT_RESUME: Resume = {
  name: 'Jake Ryan',
  contact: [
    '123-456-7890',
    'jake@example.com',
    'linkedin.com/in/jake',
    'github.com/jake',
  ],
  sections: [
    {
      title: 'Education',
      entries: [
        {
          title: 'Bachelor of Arts in Computer Science, GPA: 3.8',
          subtitle: 'Southwestern University',
          location: 'Georgetown, TX',
          dateRange: 'Aug. 2018 – May 2022',
          bullets: [],
        },
        {
          title: 'Associate Diploma in Liberal Arts',
          subtitle: 'Blinn College',
          location: 'Bryan, TX',
          dateRange: 'Aug. 2016 – May 2018',
          bullets: [],
        },
      ],
    },
    {
      title: 'Experience',
      entries: [
        {
          title: 'Undergraduate Research Assistant',
          subtitle: 'Texas A&M University',
          location: 'College Station, TX',
          dateRange: 'June 2020 – Present',
          bullets: [
            'Developed a REST API using FastAPI and PostgreSQL to store data from learning management systems',
            'Explored methods to generate audio and visual output from stored data',
            'Wrote Python scripts to automatically update and clean databases',
          ],
        },
        {
          title: 'Information Technology Support Specialist',
          subtitle: 'Southwestern University',
          location: 'Georgetown, TX',
          dateRange: 'Sep. 2018 – Present',
          bullets: [
            'Communicate with managers to set up campus computers used on campus',
            'Assessed and stocked inventory of computers, laptops, and other department property',
            'Guided students, faculty, and staff through IT support processes',
          ],
        },
      ],
    },
    {
      title: 'Projects',
      entries: [
        {
          title: 'Gitlytics',
          subtitle: 'Python, Flask, React, PostgreSQL, AWS',
          location: '',
          dateRange: 'June 2020 – Present',
          bullets: [
            'Developed a full-stack web application using Flask serving a REST API with React as the frontend',
            'Implemented GitHub OAuth to get data from user repositories',
            'Visualized GitHub data to show collaboration insights',
            'Used Celery and Redis for asynchronous tasks',
          ],
        },
        {
          title: 'Simple Resume',
          subtitle: 'Rust, Actix-Web, JavaScript',
          location: '',
          dateRange: 'June 2019 – Present',
          bullets: [
            'Developed a concurrent backend in Rust using Actix-Web framework and RESTful API design',
            'Implemented a CRUD application for PDF uploading and parsing',
            'Collaborated with Elsevier to visualize, further analyze, and present data',
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
            'Languages: Java, Python, C/C++, SQL, JavaScript, HTML/CSS, R',
            'Frameworks: React, Node.js, Flask, JUnit, WordPress, Material-UI, FastAPI',
            'Developer Tools: Git, Docker, TravisCI, Google Cloud Platform, VS Code, PyCharm, IntelliJ',
            'Libraries: pandas, NumPy, Matplotlib',
          ],
        },
      ],
    },
  ],
}
