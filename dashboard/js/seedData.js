/**
 * CivicResolve AI — Realistic Municipal Seed Dataset
 * Conforms strictly to docs/DATABASE_SCHEMA.md & docs/API_CONTRACT.md
 */

const SEED_DATA = {
  workers: [
    {
      id: "WRK001",
      name: "Ramesh Pawar",
      department: "ROAD_DEPARTMENT",
      phone: "+91 98231 44521",
      status: "BUSY",
      activeTasks: 2,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60"
    },
    {
      id: "WRK002",
      name: "Sachin Kulkarni",
      department: "ROAD_DEPARTMENT",
      phone: "+91 98234 11200",
      status: "AVAILABLE",
      activeTasks: 0,
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60"
    },
    {
      id: "WRK003",
      name: "Sunita Kamble",
      department: "SANITATION_DEPARTMENT",
      phone: "+91 98220 89104",
      status: "BUSY",
      activeTasks: 1,
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=60"
    },
    {
      id: "WRK004",
      name: "Anil Jadhav",
      department: "WATER_SUPPLY_SEWERAGE",
      phone: "+91 98211 77209",
      status: "BUSY",
      activeTasks: 2,
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60"
    },
    {
      id: "WRK005",
      name: "Pooja Patil",
      department: "ELECTRICITY_BOARD",
      phone: "+91 98255 33219",
      status: "AVAILABLE",
      activeTasks: 0,
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=60"
    },
    {
      id: "WRK006",
      name: "Vikram Shinde",
      department: "DRAINAGE_WORKS",
      phone: "+91 98266 55431",
      status: "BUSY",
      activeTasks: 1,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=60"
    }
  ],

  complaints: [
    {
      complaint_id: "CMP001",
      citizen_id: "CIT001",
      citizen_name: "Amit Deshmukh",
      citizen_phone: "+91 98765 43210",
      description: "Severe deep pothole on Station Road causing traffic congestion and two-wheeler skidding risk.",
      image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
      voice_url: "demo_audio_pothole.mp3",
      latitude: 16.7050,
      longitude: 74.2433,
      location_text: "Station Road near Central Bus Stand, Ward 12",
      issue_type: "POTHOLE",
      severity: "CRITICAL",
      severity_score: 0.94,
      department: "ROAD_DEPARTMENT",
      confidence: 0.96,
      reason: "High traffic arterial corridor with crater-depth depression posing immediate structural collision hazard.",
      evidence: [
        "Severe crater depression > 18cm depth detected",
        "Directly on high-volume bus transit lane",
        "Two-wheeler skid marks identified near pothole lip",
        "Water collection compounding asphalt degradation"
      ],
      status: "IN_PROGRESS",
      assigned_worker_id: "WRK001",
      duplicate_of: null,
      similarity_score: 0.0,
      created_at: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString(), // 3.5 hrs ago
      updated_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      sla_deadline: new Date(Date.now() + 0.5 * 3600 * 1000).toISOString(), // 30 min left
      resolved_at: null,
      closed_at: null,
      resolutions: []
    },
    {
      complaint_id: "CMP002",
      citizen_id: "CIT002",
      citizen_name: "Meera Joshi",
      citizen_phone: "+91 98111 22334",
      description: "Overflowing municipal waste bins spilling onto market sidewalk with stray animal scavenging.",
      image_url: "https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=600&auto=format&fit=crop&q=80",
      voice_url: null,
      latitude: 16.6985,
      longitude: 74.2312,
      location_text: "Laxmipuri Vegetable Market, Gate No. 2",
      issue_type: "GARBAGE",
      severity: "HIGH",
      severity_score: 0.82,
      department: "SANITATION_DEPARTMENT",
      confidence: 0.91,
      reason: "Uncollected solid municipal waste blockading commercial pedestrian zone with biological health risks.",
      evidence: [
        "Uncontained decomposition waste volume exceeds bin capacity by 250%",
        "Pedestrian footway obstructed",
        "Vector breeding and biological contamination hazard"
      ],
      status: "VERIFICATION",
      assigned_worker_id: "WRK003",
      duplicate_of: null,
      similarity_score: 0.0,
      created_at: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 0.5 * 3600 * 1000).toISOString(),
      sla_deadline: new Date(Date.now() + 2 * 3600 * 1000).toISOString(),
      resolved_at: new Date(Date.now() - 0.5 * 3600 * 1000).toISOString(),
      closed_at: null,
      resolutions: [
        {
          resolution_id: "RES002",
          complaint_id: "CMP002",
          worker_id: "WRK003",
          resolution_description: "Sanitation team deployed hydraulic compactor truck. Entire secondary waste dump cleared and lime powder disinfectant applied.",
          after_image_url: "https://images.unsplash.com/photo-1584467735815-f778f274e296?w=600&auto=format&fit=crop&q=80",
          submitted_at: new Date(Date.now() - 0.5 * 3600 * 1000).toISOString(),
          verification_status: "PENDING",
          verification_confidence: 0.92,
          verification_reason: "After-image shows sanitized pavement, emptied container bins, and lime dusting verification."
        }
      ]
    },
    {
      complaint_id: "CMP003",
      citizen_id: "CIT003",
      citizen_name: "Rahul Chavan",
      citizen_phone: "+91 98450 78901",
      description: "Underground main drinking water pipeline burst creating heavy pressurized leak and street flooding.",
      image_url: "https://images.unsplash.com/photo-1541888946425-d0fbb186c5f8?w=600&auto=format&fit=crop&q=80",
      voice_url: null,
      latitude: 16.7120,
      longitude: 74.2510,
      location_text: "Tarabai Park, Cross Road 4",
      issue_type: "WATER_LEAKAGE",
      severity: "CRITICAL",
      severity_score: 0.98,
      department: "WATER_SUPPLY_SEWERAGE",
      confidence: 0.97,
      reason: "High-pressure potable water distribution fracture draining municipal reservoir supply and eroding sub-roadbed.",
      evidence: [
        "Continuous pressurized gusher from pipeline fracture",
        "Drinking water wastage estimated > 5,000 liters/hr",
        "Sub-base erosion undermining road stability"
      ],
      status: "ESCALATED",
      assigned_worker_id: "WRK004",
      duplicate_of: null,
      similarity_score: 0.0,
      created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 0.8 * 3600 * 1000).toISOString(),
      sla_deadline: new Date(Date.now() - 3 * 3600 * 1000).toISOString(), // Breached!
      resolved_at: null,
      closed_at: null,
      resolutions: []
    },
    {
      complaint_id: "CMP004",
      citizen_id: "CIT004",
      citizen_name: "Dr. Ananya Sen",
      citizen_phone: "+91 98777 65412",
      description: "Open manhole cover on walking track. Complete fall hazard for morning walkers and children.",
      image_url: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=600&auto=format&fit=crop&q=80",
      voice_url: null,
      latitude: 16.7025,
      longitude: 74.2405,
      location_text: "Rankala Lake Promenade, North Garden Entrance",
      issue_type: "DRAINAGE",
      severity: "CRITICAL",
      severity_score: 0.95,
      department: "DRAINAGE_WORKS",
      confidence: 0.94,
      reason: "Missing storm drainage manhole cover on active promenade presenting life-safety fall risk.",
      evidence: [
        "Uncovered 2.5m deep sewer vertical drop",
        "Heavy pedestrian foot traffic area",
        "No barricade or safety warning flag installed"
      ],
      status: "ASSIGNED",
      assigned_worker_id: "WRK006",
      duplicate_of: null,
      similarity_score: 0.0,
      created_at: new Date(Date.now() - 1.2 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      sla_deadline: new Date(Date.now() + 2.8 * 3600 * 1000).toISOString(),
      resolved_at: null,
      closed_at: null,
      resolutions: []
    },
    {
      complaint_id: "CMP005",
      citizen_id: "CIT005",
      citizen_name: "Vijay More",
      citizen_phone: "+91 98900 12345",
      description: "Street light pole flickering and damaged wiring exposed near school gate.",
      image_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
      voice_url: null,
      latitude: 16.7088,
      longitude: 74.2377,
      location_text: "Shahupuri 3rd Lane, Opposite City High School",
      issue_type: "STREET_LIGHT",
      severity: "MEDIUM",
      severity_score: 0.65,
      department: "ELECTRICITY_BOARD",
      confidence: 0.88,
      reason: "Faulty ballast and loose electrical junction box near school campus.",
      evidence: [
        "Intermittent luminaire failure",
        "Junction box cover dislodged with accessible low-voltage lines"
      ],
      status: "CLOSED",
      assigned_worker_id: "WRK005",
      duplicate_of: null,
      similarity_score: 0.0,
      created_at: new Date(Date.now() - 28 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      sla_deadline: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      resolved_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
      closed_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      resolutions: [
        {
          resolution_id: "RES005",
          complaint_id: "CMP005",
          worker_id: "WRK005",
          resolution_description: "Installed new LED fixture, secured and weatherproofed junction terminal enclosure.",
          after_image_url: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=600&auto=format&fit=crop&q=80",
          submitted_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
          verification_status: "PASSED",
          verification_confidence: 0.95,
          verification_reason: "After-image confirms new luminaire operational, cable junction tightly sealed."
        }
      ]
    },
    {
      complaint_id: "CMP006",
      citizen_id: "CIT006",
      citizen_name: "Ganesh Kadam",
      citizen_phone: "+91 98888 33322",
      description: "Illegal debris dumping on open plot creating dust pollution and road narrowing.",
      image_url: "https://images.unsplash.com/photo-1611288875785-3c0788647565?w=600&auto=format&fit=crop&q=80",
      voice_url: null,
      latitude: 16.6912,
      longitude: 74.2250,
      location_text: "Rajarampuri 8th Lane corner, Plot #45",
      issue_type: "ILLEGAL_DUMPING",
      severity: "MEDIUM",
      severity_score: 0.58,
      department: "SANITATION_DEPARTMENT",
      confidence: 0.85,
      reason: "Construction rubble and concrete debris deposited in unauthorized municipal zone.",
      evidence: [
        "Unlicensed construction aggregate waste > 4 metric tons",
        "Encroaching 1.2m into carriageway"
      ],
      status: "NEW",
      assigned_worker_id: null,
      duplicate_of: null,
      similarity_score: 0.0,
      created_at: new Date(Date.now() - 0.4 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 0.4 * 3600 * 1000).toISOString(),
      sla_deadline: new Date(Date.now() + 23.6 * 3600 * 1000).toISOString(),
      resolved_at: null,
      closed_at: null,
      resolutions: []
    },
    {
      complaint_id: "CMP007",
      citizen_id: "CIT007",
      citizen_name: "Sneha Ghorpade",
      citizen_phone: "+91 98666 44433",
      description: "Pothole on station road near bus depot. (Duplicate cluster of CMP001).",
      image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=600&auto=format&fit=crop&q=80",
      voice_url: null,
      latitude: 16.7052,
      longitude: 74.2435,
      location_text: "Bus stand exit road, Station area",
      issue_type: "POTHOLE",
      severity: "CRITICAL",
      severity_score: 0.92,
      department: "ROAD_DEPARTMENT",
      confidence: 0.94,
      reason: "Detected high-proximity duplicate incident report matching active complaint CMP001.",
      evidence: [
        "GPS coordinates within 24 meters of CMP001",
        "Computer vision surface texture match score: 91.4%",
        "Auto-linked to parent complaint CMP001"
      ],
      status: "IN_PROGRESS",
      assigned_worker_id: "WRK001",
      duplicate_of: "CMP001",
      similarity_score: 0.93,
      created_at: new Date(Date.now() - 2.1 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
      sla_deadline: new Date(Date.now() + 0.5 * 3600 * 1000).toISOString(),
      resolved_at: null,
      closed_at: null,
      resolutions: []
    },
    {
      complaint_id: "CMP008",
      citizen_id: "CIT008",
      citizen_name: "Tanaji Shinde",
      citizen_phone: "+91 98333 11188",
      description: "Stormwater gutter choked with plastic bottles causing backflow into shops during rain.",
      image_url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80",
      voice_url: null,
      latitude: 16.7001,
      longitude: 74.2468,
      location_text: "Bindu Chowk Commercial Complex, Shop 10-18",
      issue_type: "DRAINAGE",
      severity: "HIGH",
      severity_score: 0.86,
      department: "DRAINAGE_WORKS",
      confidence: 0.89,
      reason: "Severe silt and refuse accumulation creating hydrostatic reflux into commercial basements.",
      evidence: [
        "Full conduit occlusion (> 80% flow restriction)",
        "Water stagnation and sewage odors"
      ],
      status: "REOPENED",
      assigned_worker_id: "WRK006",
      duplicate_of: null,
      similarity_score: 0.0,
      created_at: new Date(Date.now() - 40 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      sla_deadline: new Date(Date.now() + 4 * 3600 * 1000).toISOString(),
      resolved_at: null,
      closed_at: null,
      resolutions: [
        {
          resolution_id: "RES008",
          complaint_id: "CMP008",
          worker_id: "WRK006",
          resolution_description: "Surface garbage skimmed from drain grating.",
          after_image_url: "https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&auto=format&fit=crop&q=80",
          submitted_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
          verification_status: "FAILED",
          verification_confidence: 0.88,
          verification_reason: "AI Verification Rejected: Deep silt choke still visible inside conduit; surface skimming insufficient."
        }
      ]
    }
  ],

  agentActions: [
    {
      action_id: "ACT001",
      complaint_id: "CMP001",
      agent: "CivicResolutionAgent",
      action: "PERCEIVE_EVIDENCE",
      reason: "Multimodal ingestion of citizen report text and image uploads",
      result: "Ingested high-resolution photo and location coordinates",
      timestamp: new Date(Date.now() - 3.48 * 3600 * 1000).toISOString()
    },
    {
      action_id: "ACT002",
      complaint_id: "CMP001",
      agent: "CivicResolutionAgent",
      action: "CLASSIFY_ISSUE",
      reason: "Computer vision detects asphalt displacement and cavity contour",
      result: "Classified as POTHOLE (Confidence: 0.96)",
      timestamp: new Date(Date.now() - 3.46 * 3600 * 1000).toISOString()
    },
    {
      action_id: "ACT003",
      complaint_id: "CMP001",
      agent: "CivicResolutionAgent",
      action: "ASSESS_SEVERITY",
      reason: "High traffic corridor + deep asphalt cavity",
      result: "Severity CRITICAL (Score: 0.94, SLA: 4 Hours)",
      timestamp: new Date(Date.now() - 3.45 * 3600 * 1000).toISOString()
    },
    {
      action_id: "ACT004",
      complaint_id: "CMP001",
      agent: "CivicResolutionAgent",
      action: "ASSIGN_DEPARTMENT",
      reason: "Road infrastructure surface failure routing",
      result: "Assigned to ROAD_DEPARTMENT",
      timestamp: new Date(Date.now() - 3.44 * 3600 * 1000).toISOString()
    },
    {
      action_id: "ACT005",
      complaint_id: "CMP003",
      agent: "CivicResolutionAgent",
      action: "SLA_BREACH_CHECK",
      reason: "Time elapsed 6.0 hrs exceeds Critical 3.0 hr SLA deadline",
      result: "SLA_BREACH triggered",
      timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
    },
    {
      action_id: "ACT006",
      complaint_id: "CMP003",
      agent: "CivicResolutionAgent",
      action: "ESCALATE",
      reason: "Unresolved critical water main break past SLA window",
      result: "Status upgraded to ESCALATED. High priority notification sent to Chief City Engineer.",
      timestamp: new Date(Date.now() - 2.95 * 3600 * 1000).toISOString()
    },
    {
      action_id: "ACT007",
      complaint_id: "CMP008",
      agent: "CivicResolutionAgent",
      action: "VERIFY_RESOLUTION",
      reason: "Autonomous visual inspection of submitted after-image vs baseline",
      result: "Verification FAILED: Conduit obstruction still present. Complaint REOPENED.",
      timestamp: new Date(Date.now() - 2.2 * 3600 * 1000).toISOString()
    }
  ]
};

window.SEED_DATA = SEED_DATA;
