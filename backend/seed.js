const Booth = require('./models/Booth');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('./models/User');
const Event = require('./models/Event');

const pexels = (id) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1200`;

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // 1. Seed Users (Admin, Attendee, 8 Approved Exhibitors, 2 Pending Exhibitors)
    const usersToSeed = [
      {
        name: 'EventSphere Admin',
        email: 'admin@eventsphere.io',
        password: hashedPassword,
        role: 'admin',
        isApproved: true,
      },
      {
        name: 'Demo Attendee',
        email: 'attendee@eventsphere.io',
        password: hashedPassword,
        role: 'attendee',
        isApproved: true,
        bookmarks: [],
      },
      {
        name: 'Sara Khan',
        email: 'nova@exhibitor.io',
        password: hashedPassword,
        role: 'exhibitor',
        companyName: 'NovaCloud Systems',
        companyDescription: 'Enterprise cloud infrastructure, edge analytics, and AI deployment pipelines.',
        logoUrl: '',
        isApproved: true,
      },
      {
        name: 'Bilal Ahmed',
        email: 'pixel@exhibitor.io',
        password: hashedPassword,
        role: 'exhibitor',
        companyName: 'PixelForge Studio',
        companyDescription: 'Interactive 3D product showcases, spatial UI tools, and SaaS motion design systems.',
        logoUrl: '',
        isApproved: true,
      },
      {
        name: 'Hina Tariq',
        email: 'greengrid@exhibitor.io',
        password: hashedPassword,
        role: 'exhibitor',
        companyName: 'GreenGrid Energy',
        companyDescription: 'Smart solar microgrids and real-time energy monitoring hardware for large venues.',
        logoUrl: '',
        isApproved: true,
      },
      {
        name: 'Usman Farooq',
        email: 'payflow@exhibitor.io',
        password: hashedPassword,
        role: 'exhibitor',
        companyName: 'PayFlow Labs',
        companyDescription: 'Instant cross-border B2B payment APIs, merchant checkout SDKs, and fraud detection.',
        logoUrl: '',
        isApproved: true,
      },
      {
        name: 'Areeba Siddiqui',
        email: 'aegis@exhibitor.io',
        password: hashedPassword,
        role: 'exhibitor',
        companyName: 'Aegis Cyber Defense',
        companyDescription: 'Zero-trust cloud security monitoring, automated pentesting, and SOC tooling.',
        logoUrl: '',
        isApproved: true,
      },
      {
        name: 'Daniyal Raza',
        email: 'hyperion@exhibitor.io',
        password: hashedPassword,
        role: 'exhibitor',
        companyName: 'Hyperion Esports Gear',
        companyDescription: 'Tournament-grade low-latency peripherals, VR simulators, and streaming rigs.',
        logoUrl: '',
        isApproved: true,
      },
      {
        name: 'Dr. Mehwish Ali',
        email: 'vitalis@exhibitor.io',
        password: hashedPassword,
        role: 'exhibitor',
        companyName: 'Vitalis HealthTech',
        companyDescription: 'AI-assisted diagnostic wearables and cloud telemedicine platforms for clinics.',
        logoUrl: '',
        isApproved: true,
      },
      {
        name: 'Taha Javed',
        email: 'learnloop@exhibitor.io',
        password: hashedPassword,
        role: 'exhibitor',
        companyName: 'LearnLoop Interactive',
        companyDescription: 'Adaptive coding sandboxes and virtual lab environments for universities.',
        logoUrl: '',
        isApproved: true,
      },
      // Pending exhibitors (for Admin approval queue testing)
      {
        name: 'Zoya Naeem',
        email: 'orbit@exhibitor.io',
        password: hashedPassword,
        role: 'exhibitor',
        companyName: 'Orbit Robotics',
        companyDescription: 'Autonomous warehouse delivery bots and computer-vision sorting arms.',
        logoUrl: '',
        isApproved: false,
      },
      {
        name: 'Faisal Qureshi',
        email: 'cartpulse@exhibitor.io',
        password: hashedPassword,
        role: 'exhibitor',
        companyName: 'CartPulse Commerce',
        companyDescription: 'Omnichannel headless retail software and automated fulfillment dashboards.',
        logoUrl: '',
        isApproved: false,
      },
    ];

    for (const u of usersToSeed) {
      await User.findOneAndUpdate(
        { email: u.email },
        { $setOnInsert: u },
        { upsert: true, new: true }
      );
    }

    const admin = await User.findOne({ email: 'admin@eventsphere.io' });
    const approvedExhibitors = await User.find({ role: 'exhibitor', isApproved: true }).select('_id email');
    const exId = (email) => approvedExhibitors.find((x) => x.email === email)?._id;

    // 2. Seed 14 Events (2 for each of the 7 Browse by Category sections)
    const eventsToSeed = [
      // ---------------- TECHNOLOGY (2) ----------------
      {
        title: 'FutureTech & AI Expo 2026',
        description: 'Three days of live AI demos, full-stack developer workshops, and startup showcases.',
        theme: 'Technology',
        eventType: 'Expo',
        imageUrl: pexels('39570524'),
        attendees: 4200,
        highlights: ['40+ AI & Cloud Booths', 'Live Startup Pitch Arena', 'Hands-on MERN & LLM Labs'],
        exhibitors: [exId('nova@exhibitor.io'), exId('aegis@exhibitor.io')].filter(Boolean),
        startDate: new Date('2026-12-10T09:00:00Z'),
        endDate: new Date('2026-12-12T18:00:00Z'),
        location: 'Expo Centre, Karachi',
        organizer: admin._id,
        schedule: [
          {
            sessionTitle: 'Opening Keynote: Real-Time Web Architecture',
            speakerName: 'Dr. Omar Farooq',
            startTime: new Date('2026-12-10T10:00:00Z'),
            endTime: new Date('2026-12-10T11:15:00Z'),
            locationDetails: 'Main Auditorium - Hall A',
          },
          {
            sessionTitle: 'Building Scalable MERN Apps with WebSockets',
            speakerName: 'Zainab Raza',
            startTime: new Date('2026-12-10T13:00:00Z'),
            endTime: new Date('2026-12-10T14:30:00Z'),
            locationDetails: 'Workshop Room 2',
          },
          {
            sessionTitle: 'Startup Pitch Arena & Investor Q&A',
            speakerName: 'Kamran Siddiqui',
            startTime: new Date('2026-12-11T11:00:00Z'),
            endTime: new Date('2026-12-11T12:30:00Z'),
            locationDetails: 'Innovation Stage',
          },
        ],
      },
      {
        title: 'CyberSec & Cloud Defense Con',
        description: 'Red-team simulations, zero-trust cloud architecture, and enterprise threat hunting.',
        theme: 'Technology',
        eventType: 'Conference',
        imageUrl: pexels('37605911'),
        attendees: 1900,
        highlights: ['24-Hour Capture The Flag', 'Live SOC War Room', 'CISO Strategy Track'],
        exhibitors: [exId('aegis@exhibitor.io'), exId('nova@exhibitor.io')].filter(Boolean),
        startDate: new Date('2027-02-19T09:00:00Z'),
        endDate: new Date('2027-02-20T18:00:00Z'),
        location: 'Jinnah Convention Centre, Islamabad',
        organizer: admin._id,
        schedule: [
          {
            sessionTitle: 'Securing Microservices & JWT Auth in Production',
            speakerName: 'Hassan Raza',
            startTime: new Date('2027-02-19T10:30:00Z'),
            endTime: new Date('2027-02-19T11:45:00Z'),
            locationDetails: 'Auditorium 1',
          },
          {
            sessionTitle: 'Live Incident Response Walkthrough',
            speakerName: 'Areeba Siddiqui',
            startTime: new Date('2027-02-20T13:30:00Z'),
            endTime: new Date('2027-02-20T15:00:00Z'),
            locationDetails: 'Defense Lab B',
          },
        ],
      },

      // ---------------- BUSINESS (2) ----------------
      {
        title: 'FinTech & Digital Banking Summit',
        description: 'Exploring instant payment rails, embedded finance, and next-gen digital wallets.',
        theme: 'Business',
        eventType: 'Conference',
        imageUrl: pexels('3321801'),
        attendees: 3100,
        highlights: ['Regulatory Roundtable', 'Payment API Sandbox', 'VC Fireside Chats'],
        exhibitors: [exId('payflow@exhibitor.io'), exId('aegis@exhibitor.io')].filter(Boolean),
        startDate: new Date('2027-01-24T09:00:00Z'),
        endDate: new Date('2027-01-25T17:00:00Z'),
        location: 'Pearl Continental Ballroom, Karachi',
        organizer: admin._id,
        schedule: [
          {
            sessionTitle: 'Scaling Real-Time Cross-Border Payments',
            speakerName: 'Salman Javed',
            startTime: new Date('2027-01-24T10:00:00Z'),
            endTime: new Date('2027-01-24T11:15:00Z'),
            locationDetails: 'Grand Ballroom A',
          },
          {
            sessionTitle: 'AI Fraud Prevention at Checkout Speed',
            speakerName: 'Maha Zubair',
            startTime: new Date('2027-01-24T14:00:00Z'),
            endTime: new Date('2027-01-24T15:15:00Z'),
            locationDetails: 'Executive Suite 3',
          },
        ],
      },
      {
        title: 'E-Commerce & Retail Innovation Expo',
        description: 'Direct-to-consumer growth playbooks, logistics automation, and omnichannel retail tech.',
        theme: 'Business',
        eventType: 'Expo',
        imageUrl: pexels('30530404'),
        attendees: 3400,
        highlights: ['DTC Brand Case Studies', 'Fulfillment & Last-Mile Tech', 'Founder Lounge'],
        exhibitors: [exId('payflow@exhibitor.io'), exId('nova@exhibitor.io')].filter(Boolean),
        startDate: new Date('2027-03-18T10:00:00Z'),
        endDate: new Date('2027-03-19T18:30:00Z'),
        location: 'Faletti Convention Hall, Lahore',
        organizer: admin._id,
        schedule: [
          {
            sessionTitle: 'Conversion-First Storefronts for High-Growth Brands',
            speakerName: 'Sana Mir',
            startTime: new Date('2027-03-18T11:00:00Z'),
            endTime: new Date('2027-03-18T12:15:00Z'),
            locationDetails: 'Commerce Stage',
          },
          {
            sessionTitle: 'Same-Day Logistics & Smart Inventory Forecasting',
            speakerName: 'Adeel Chaudhry',
            startTime: new Date('2027-03-19T13:00:00Z'),
            endTime: new Date('2027-03-19T14:15:00Z'),
            locationDetails: 'Operations Room 2',
          },
        ],
      },

      // ---------------- EDUCATION (2) ----------------
      {
        title: 'EdTech & Future Learning Forum',
        description: 'Interactive classrooms, AI tutoring platforms, and university career bootcamps.',
        theme: 'Education',
        eventType: 'Forum',
        imageUrl: pexels('5552640'),
        attendees: 2100,
        highlights: ['Interactive Lab Demos', 'Faculty Innovation Grants', 'Student Hackathon'],
        exhibitors: [exId('learnloop@exhibitor.io')].filter(Boolean),
        startDate: new Date('2027-04-02T09:00:00Z'),
        endDate: new Date('2027-04-03T16:30:00Z'),
        location: 'NUST Convention Hall, Islamabad',
        organizer: admin._id,
        schedule: [
          {
            sessionTitle: 'Project-Based Coding Labs at Campus Scale',
            speakerName: 'Taha Javed',
            startTime: new Date('2027-04-02T10:00:00Z'),
            endTime: new Date('2027-04-02T11:30:00Z'),
            locationDetails: 'Main Lecture Hall',
          },
          {
            sessionTitle: 'Designing Accessible Digital Learning Tools',
            speakerName: 'Prof. Farhana Yasmin',
            startTime: new Date('2027-04-03T12:00:00Z'),
            endTime: new Date('2027-04-03T13:15:00Z'),
            locationDetails: 'Hall B',
          },
        ],
      },
      {
        title: 'National STEM & University Careers Expo',
        description: 'Connecting students, educators, and hiring labs across software, engineering, and design.',
        theme: 'Education',
        eventType: 'Expo',
        imageUrl: pexels('14612128'),
        attendees: 2800,
        highlights: ['Scholarship Pavilions', 'Live Portfolio Clinics', 'Graduate Hiring Booths'],
        exhibitors: [exId('learnloop@exhibitor.io'), exId('pixel@exhibitor.io')].filter(Boolean),
        startDate: new Date('2027-04-16T09:30:00Z'),
        endDate: new Date('2027-04-17T17:00:00Z'),
        location: 'Expo Centre Hall 3, Karachi',
        organizer: admin._id,
        schedule: [
          {
            sessionTitle: 'Breaking Into Full-Stack & UI/UX Engineering',
            speakerName: 'Imran Qureshi',
            startTime: new Date('2027-04-16T11:00:00Z'),
            endTime: new Date('2027-04-16T12:15:00Z'),
            locationDetails: 'Career Stage A',
          },
          {
            sessionTitle: 'Building Standout Capstone Projects That Get Hired',
            speakerName: 'Mariam Sohail',
            startTime: new Date('2027-04-17T14:00:00Z'),
            endTime: new Date('2027-04-17T15:15:00Z'),
            locationDetails: 'Workshop Room 1',
          },
        ],
      },

      // ---------------- INNOVATION (2) ----------------
      {
        title: 'Design & Motion Summit',
        description: 'UI/UX design systems, SaaS product storytelling, and interactive motion graphics.',
        theme: 'Innovation',
        eventType: 'Summit',
        imageUrl: pexels('18999177'),
        attendees: 1850,
        highlights: ['Live Portfolio Reviews', 'Figma to Code Deep Dives', 'Motion Craft Showcase'],
        exhibitors: [exId('pixel@exhibitor.io')].filter(Boolean),
        startDate: new Date('2026-12-18T09:30:00Z'),
        endDate: new Date('2026-12-19T17:00:00Z'),
        location: 'Expo Centre, Lahore',
        organizer: admin._id,
        schedule: [
          {
            sessionTitle: 'Design Tokens That Survive Real Codebases',
            speakerName: 'Ayesha Malik',
            startTime: new Date('2026-12-18T10:30:00Z'),
            endTime: new Date('2026-12-18T11:45:00Z'),
            locationDetails: 'Studio Hall B',
          },
          {
            sessionTitle: 'Motion Graphics for Modern SaaS Interfaces',
            speakerName: 'Hamza Tariq',
            startTime: new Date('2026-12-18T14:00:00Z'),
            endTime: new Date('2026-12-18T15:30:00Z'),
            locationDetails: 'Creative Lab 1',
          },
        ],
      },
      {
        title: 'Green Energy & Smart Cities Forum',
        description: 'Connecting clean-tech exhibitors, urban planners, and sustainability engineers.',
        theme: 'Innovation',
        eventType: 'Forum',
        imageUrl: pexels('12923395'),
        attendees: 2600,
        highlights: ['Solar Microgrid Live Pavilion', 'EV Charging Demos', 'Climate Tech Panels'],
        exhibitors: [exId('greengrid@exhibitor.io')].filter(Boolean),
        startDate: new Date('2027-01-15T09:00:00Z'),
        endDate: new Date('2027-01-17T17:30:00Z'),
        location: 'Pak-China Friendship Centre, Islamabad',
        organizer: admin._id,
        schedule: [
          {
            sessionTitle: 'Smart Microgrids for Commercial Venues',
            speakerName: 'Engr. Tariq Mahmood',
            startTime: new Date('2027-01-15T10:00:00Z'),
            endTime: new Date('2027-01-15T11:30:00Z'),
            locationDetails: 'Plenary Hall',
          },
          {
            sessionTitle: 'IoT Sensors in Urban Infrastructure',
            speakerName: 'Nadia Hussain',
            startTime: new Date('2027-01-16T12:00:00Z'),
            endTime: new Date('2027-01-16T13:15:00Z'),
            locationDetails: 'Conference Room C',
          },
        ],
      },

      // ---------------- HEALTHCARE (2) ----------------
      {
        title: 'MedTech & Digital Health Expo',
        description: 'Telemedicine platforms, wearable diagnostics, and hospital automation breakthroughs.',
        theme: 'Healthcare',
        eventType: 'Expo',
        imageUrl: pexels('8376282'),
        attendees: 2300,
        highlights: ['Clinical AI Demonstrations', 'Smart Diagnostics Floor', 'Hospital CIO Panels'],
        exhibitors: [exId('vitalis@exhibitor.io')].filter(Boolean),
        startDate: new Date('2027-03-04T09:00:00Z'),
        endDate: new Date('2027-03-06T17:00:00Z'),
        location: 'Expo Centre Hall 2, Karachi',
        organizer: admin._id,
        schedule: [
          {
            sessionTitle: 'Remote Patient Monitoring with Low-Power Wearables',
            speakerName: 'Dr. Mehwish Ali',
            startTime: new Date('2027-03-04T11:00:00Z'),
            endTime: new Date('2027-03-04T12:15:00Z'),
            locationDetails: 'Health Innovation Hall',
          },
          {
            sessionTitle: 'Privacy & Compliance in Electronic Health Records',
            speakerName: 'Dr. Kamran Aziz',
            startTime: new Date('2027-03-05T14:30:00Z'),
            endTime: new Date('2027-03-05T15:45:00Z'),
            locationDetails: 'Seminar Room 4',
          },
        ],
      },
      {
        title: 'Global BioPharma & Wellness Symposium',
        description: 'Clinical research breakthroughs, biotech lab automation, and preventive healthcare.',
        theme: 'Healthcare',
        eventType: 'Conference',
        imageUrl: pexels('8532863'),
        attendees: 1650,
        highlights: ['Biotech Lab Showcase', 'Clinical Trials Track', 'Digital Pharmacy Demos'],
        exhibitors: [exId('vitalis@exhibitor.io'), exId('nova@exhibitor.io')].filter(Boolean),
        startDate: new Date('2027-04-22T09:00:00Z'),
        endDate: new Date('2027-04-23T17:30:00Z'),
        location: 'Avari Convention Centre, Lahore',
        organizer: admin._id,
        schedule: [
          {
            sessionTitle: 'AI-Accelerated Diagnostics in Pathology Labs',
            speakerName: 'Dr. Farhan Siddiqui',
            startTime: new Date('2027-04-22T10:30:00Z'),
            endTime: new Date('2027-04-22T11:45:00Z'),
            locationDetails: 'Main Symposium Hall',
          },
          {
            sessionTitle: 'Scaling Telehealth Clinics Across Rural Regions',
            speakerName: 'Dr. Saima Nawaz',
            startTime: new Date('2027-04-23T13:30:00Z'),
            endTime: new Date('2027-04-23T14:45:00Z'),
            locationDetails: 'Panel Room 2',
          },
        ],
      },

      // ---------------- NETWORKING (2) ----------------
      {
        title: 'Founders, Angels & Startup Mixer 2027',
        description: 'Curated speed-networking, seed-stage pitch tables, and founder roundtables.',
        theme: 'Networking',
        eventType: 'Mixer',
        imageUrl: pexels('38598139'),
        attendees: 950,
        highlights: ['1-on-1 Investor Speed Tables', 'SaaS Founder Lounge', 'Live Demo Alley'],
        exhibitors: [exId('payflow@exhibitor.io'), exId('pixel@exhibitor.io')].filter(Boolean),
        startDate: new Date('2027-02-27T16:00:00Z'),
        endDate: new Date('2027-02-27T21:30:00Z'),
        location: 'Movenpick Grand Ballroom, Karachi',
        organizer: admin._id,
        schedule: [
          {
            sessionTitle: 'Raising Pre-Seed Capital in 2027',
            speakerName: 'Nabeel Lakhani',
            startTime: new Date('2027-02-27T17:00:00Z'),
            endTime: new Date('2027-02-27T18:00:00Z'),
            locationDetails: 'Founders Stage',
          },
          {
            sessionTitle: 'Curated Investor & Founder Networking Tables',
            speakerName: 'EventSphere Community Hosts',
            startTime: new Date('2027-02-27T18:30:00Z'),
            endTime: new Date('2027-02-27T20:30:00Z'),
            locationDetails: 'Atrium Lounge',
          },
        ],
      },
      {
        title: 'Tech Leaders & Product Community Conclave',
        description: 'An evening meetup for engineering leads, product designers, and agency founders.',
        theme: 'Networking',
        eventType: 'Meetup',
        imageUrl: pexels('8761647'),
        attendees: 780,
        highlights: ['CTO & Design Lead Mixers', 'Lightning Talks', 'Open Hiring Board'],
        exhibitors: [exId('nova@exhibitor.io'), exId('aegis@exhibitor.io')].filter(Boolean),
        startDate: new Date('2027-03-27T15:00:00Z'),
        endDate: new Date('2027-03-27T20:30:00Z'),
        location: 'Serena Hotel Courtyard, Islamabad',
        organizer: admin._id,
        schedule: [
          {
            sessionTitle: 'Lightning Talks: Scaling Remote Product Teams',
            speakerName: 'Hira Mansoor',
            startTime: new Date('2027-03-27T16:00:00Z'),
            endTime: new Date('2027-03-27T17:15:00Z'),
            locationDetails: 'Courtyard Stage',
          },
          {
            sessionTitle: 'Product & Engineering Birds-of-a-Feather Mixer',
            speakerName: 'Community Chapter Leads',
            startTime: new Date('2027-03-27T17:45:00Z'),
            endTime: new Date('2027-03-27T19:45:00Z'),
            locationDetails: 'Terrace Pavilion',
          },
        ],
      },

      // ---------------- EXHIBITIONS (2) ----------------
      {
        title: 'NextGen Gaming & Esports Expo',
        description: 'Indie game showcases, competitive LAN tournaments, and interactive hardware booths.',
        theme: 'Exhibitions',
        eventType: 'Expo',
        imageUrl: pexels('9072394'),
        attendees: 5500,
        highlights: ['Live Esports Arena', 'Indie Dev Playtest Zone', 'VR & Hardware Pavilion'],
        exhibitors: [exId('hyperion@exhibitor.io'), exId('pixel@exhibitor.io')].filter(Boolean),
        startDate: new Date('2027-02-05T11:00:00Z'),
        endDate: new Date('2027-02-07T21:00:00Z'),
        location: 'Expo Centre Hall 4, Lahore',
        organizer: admin._id,
        schedule: [
          {
            sessionTitle: 'Real-Time Shader Optimization for Indie Studios',
            speakerName: 'Saad Mansoor',
            startTime: new Date('2027-02-05T13:00:00Z'),
            endTime: new Date('2027-02-05T14:15:00Z'),
            locationDetails: 'Dev Stage 1',
          },
          {
            sessionTitle: 'Championship Finals: Regional Esports Showdown',
            speakerName: 'Tournament Broadcast Team',
            startTime: new Date('2027-02-07T16:00:00Z'),
            endTime: new Date('2027-02-07T19:00:00Z'),
            locationDetails: 'Main Arena',
          },
        ],
      },
      {
        title: 'International Industrial & Trade Exhibition',
        description: 'Large-scale B2B trade floor showcasing manufacturing robotics, energy, and exports.',
        theme: 'Exhibitions',
        eventType: 'Exhibition',
        imageUrl: pexels('35138560'),
        attendees: 6200,
        highlights: ['120+ International Pavilions', 'Live Machinery Floor', 'B2B Buyer Matchmaking'],
        exhibitors: [exId('greengrid@exhibitor.io'), exId('hyperion@exhibitor.io')].filter(Boolean),
        startDate: new Date('2027-05-08T09:00:00Z'),
        endDate: new Date('2027-05-10T18:00:00Z'),
        location: 'Expo Centre Halls 1-3, Karachi',
        organizer: admin._id,
        schedule: [
          {
            sessionTitle: 'Industrial Automation & Smart Factory Walkthrough',
            speakerName: 'Engr. Bilal Zafar',
            startTime: new Date('2027-05-08T11:00:00Z'),
            endTime: new Date('2027-05-08T12:30:00Z'),
            locationDetails: 'Exhibition Hall 1 Stage',
          },
          {
            sessionTitle: 'Export Supply Chains & Global Trade Compliance',
            speakerName: 'Raza Kazim',
            startTime: new Date('2027-05-09T14:00:00Z'),
            endTime: new Date('2027-05-09T15:30:00Z'),
            locationDetails: 'Trade Conference Room A',
          },
        ],
      },
    ];

    for (const ev of eventsToSeed) {
      await Event.findOneAndUpdate(
        { title: ev.title },
        { $set: ev },
        { upsert: true, new: true }
      );
    }
// 3. Seed 14 Floor Plan Booths per Event (aligned with Konva canvas landmarks)
    const allEvents = await Event.find({}).select('_id title');
    const exhibitorIds = approvedExhibitors.map((ex) => ex._id);

    const boothLayout = [
      // Row 1: Hall A (below Keynote Stage)
      { boothNumber: 'A-101', zone: 'Hall A', size: '4m x 3m', price: 1200, status: 'Booked', exIndex: 0, coordinates: { x: 40, y: 66, width: 115, height: 84 } },
      { boothNumber: 'A-102', zone: 'Hall A', size: '4m x 3m', price: 1200, status: 'Available', exIndex: null, coordinates: { x: 170, y: 66, width: 115, height: 84 } },
      { boothNumber: 'A-103', zone: 'Hall A', size: '4m x 3m', price: 1200, status: 'Booked', exIndex: 1, coordinates: { x: 300, y: 66, width: 115, height: 84 } },
      { boothNumber: 'A-104', zone: 'Hall A', size: '4m x 3m', price: 1200, status: 'Pending', exIndex: null, coordinates: { x: 430, y: 66, width: 115, height: 84 } },

      // Row 2: Tech Pavilion (below Main Concourse Aisle)
      { boothNumber: 'T-301', zone: 'Tech Pavilion', size: '3m x 3m', price: 850, status: 'Booked', exIndex: 2, coordinates: { x: 40, y: 194, width: 115, height: 84 } },
      { boothNumber: 'T-302', zone: 'Tech Pavilion', size: '3m x 3m', price: 850, status: 'Available', exIndex: null, coordinates: { x: 170, y: 194, width: 115, height: 84 } },
      { boothNumber: 'T-303', zone: 'Tech Pavilion', size: '3m x 3m', price: 850, status: 'Available', exIndex: null, coordinates: { x: 300, y: 194, width: 115, height: 84 } },
      { boothNumber: 'T-304', zone: 'Tech Pavilion', size: '3m x 3m', price: 850, status: 'Booked', exIndex: 3, coordinates: { x: 430, y: 194, width: 115, height: 84 } },

      // Row 3: Startup Alley (below Startup & Innovation Walkway)
      { boothNumber: 'S-401', zone: 'Startup Alley', size: '2m x 2m', price: 450, status: 'Available', exIndex: null, coordinates: { x: 40, y: 320, width: 115, height: 84 } },
      { boothNumber: 'S-402', zone: 'Startup Alley', size: '2m x 2m', price: 450, status: 'Booked', exIndex: 4, coordinates: { x: 170, y: 320, width: 115, height: 84 } },
      { boothNumber: 'S-403', zone: 'Startup Alley', size: '2m x 2m', price: 450, status: 'Available', exIndex: null, coordinates: { x: 300, y: 320, width: 115, height: 84 } },
      { boothNumber: 'S-404', zone: 'Startup Alley', size: '2m x 2m', price: 450, status: 'Pending', exIndex: null, coordinates: { x: 430, y: 320, width: 115, height: 84 } },

      // Right Column: VIP Island (below North Entrance)
      { boothNumber: 'V-201', zone: 'VIP Island', size: '6m x 4m', price: 2400, status: 'Booked', exIndex: 5, coordinates: { x: 580, y: 66, width: 150, height: 156 } },
      { boothNumber: 'V-202', zone: 'VIP Island', size: '6m x 4m', price: 2400, status: 'Available', exIndex: null, coordinates: { x: 580, y: 246, width: 150, height: 158 } },
    ];

    let boothCount = 0;
    for (let i = 0; i < allEvents.length; i++) {
      const ev = allEvents[i];
      for (const template of boothLayout) {
        const assignedExhibitor =
          template.status === 'Booked' && exhibitorIds.length > 0
            ? exhibitorIds[(template.exIndex + i) % exhibitorIds.length]
            : null;

        await Booth.findOneAndUpdate(
          { eventId: ev._id, boothNumber: template.boothNumber },
          {
            $set: {
              eventId: ev._id,
              boothNumber: template.boothNumber,
              zone: template.zone,
              size: template.size,
              price: template.price,
              status: template.status,
              exhibitorId: assignedExhibitor,
              coordinates: template.coordinates,
            },
          },
          { upsert: true, new: true }
        );
        boothCount++;
      }
    }

    console.log(`Seeded ${boothCount} booths across ${allEvents.length} events.`);
    console.log(`Seed complete! Upserted ${eventsToSeed.length} events (2 per category) and ${usersToSeed.length} users.`);
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

seed();