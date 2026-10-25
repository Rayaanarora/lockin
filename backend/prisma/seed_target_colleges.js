const prisma = require("../../frontend/backend/src/config/db");
const fs = require("fs");
const path = require("path");

const TARGET_COLLEGES = [
  // ─────────────────────────────────────────────────────────────────────────────
  // 1. ALL IITs (23 Institutes + Student Email Domains)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    college_name: "Indian Institute of Technology Bombay",
    short_name: "IIT Bombay",
    college_type: "IIT",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    official_domain: "iitb.ac.in",
    email_domain: "iitb.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Bombay (Student Mail)",
    short_name: "IIT Bombay Students",
    college_type: "IIT",
    city: "Mumbai",
    state: "Maharashtra",
    country: "India",
    official_domain: "iitb.ac.in",
    email_domain: "student.iitb.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Delhi",
    short_name: "IIT Delhi",
    college_type: "IIT",
    city: "New Delhi",
    state: "Delhi",
    country: "India",
    official_domain: "iitd.ac.in",
    email_domain: "iitd.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Delhi (Student Mail)",
    short_name: "IIT Delhi Students",
    college_type: "IIT",
    city: "New Delhi",
    state: "Delhi",
    country: "India",
    official_domain: "iitd.ac.in",
    email_domain: "student.iitd.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Madras",
    short_name: "IIT Madras",
    college_type: "IIT",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "iitm.ac.in",
    email_domain: "iitm.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Madras (Student Mail)",
    short_name: "IIT Madras Smail",
    college_type: "IIT",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "iitm.ac.in",
    email_domain: "smail.iitm.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Kanpur",
    short_name: "IIT Kanpur",
    college_type: "IIT",
    city: "Kanpur",
    state: "Uttar Pradesh",
    country: "India",
    official_domain: "iitk.ac.in",
    email_domain: "iitk.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Kharagpur",
    short_name: "IIT Kharagpur",
    college_type: "IIT",
    city: "Kharagpur",
    state: "West Bengal",
    country: "India",
    official_domain: "iitkgp.ac.in",
    email_domain: "iitkgp.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Kharagpur (Student Mail)",
    short_name: "IIT Kharagpur Students",
    college_type: "IIT",
    city: "Kharagpur",
    state: "West Bengal",
    country: "India",
    official_domain: "iitkgp.ac.in",
    email_domain: "kgpian.iitkgp.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Roorkee",
    short_name: "IIT Roorkee",
    college_type: "IIT",
    city: "Roorkee",
    state: "Uttarakhand",
    country: "India",
    official_domain: "iitr.ac.in",
    email_domain: "iitr.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Guwahati",
    short_name: "IIT Guwahati",
    college_type: "IIT",
    city: "Guwahati",
    state: "Assam",
    country: "India",
    official_domain: "iitg.ac.in",
    email_domain: "iitg.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Hyderabad",
    short_name: "IIT Hyderabad",
    college_type: "IIT",
    city: "Sangareddy",
    state: "Telangana",
    country: "India",
    official_domain: "iith.ac.in",
    email_domain: "iith.ac.in"
  },
  {
    college_name: "Indian Institute of Technology (BHU) Varanasi",
    short_name: "IIT BHU",
    college_type: "IIT",
    city: "Varanasi",
    state: "Uttar Pradesh",
    country: "India",
    official_domain: "iitbhu.ac.in",
    email_domain: "iitbhu.ac.in"
  },
  {
    college_name: "Indian Institute of Technology (Indian School of Mines) Dhanbad",
    short_name: "IIT Dhanbad",
    college_type: "IIT",
    city: "Dhanbad",
    state: "Jharkhand",
    country: "India",
    official_domain: "iitism.ac.in",
    email_domain: "iitism.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Indore",
    short_name: "IIT Indore",
    college_type: "IIT",
    city: "Indore",
    state: "Madhya Pradesh",
    country: "India",
    official_domain: "iiti.ac.in",
    email_domain: "iiti.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Ropar",
    short_name: "IIT Ropar",
    college_type: "IIT",
    city: "Rupnagar",
    state: "Punjab",
    country: "India",
    official_domain: "iitrpr.ac.in",
    email_domain: "iitrpr.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Mandi",
    short_name: "IIT Mandi",
    college_type: "IIT",
    city: "Mandi",
    state: "Himachal Pradesh",
    country: "India",
    official_domain: "iitmandi.ac.in",
    email_domain: "iitmandi.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Gandhinagar",
    short_name: "IIT Gandhinagar",
    college_type: "IIT",
    city: "Gandhinagar",
    state: "Gujarat",
    country: "India",
    official_domain: "iitgn.ac.in",
    email_domain: "iitgn.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Jodhpur",
    short_name: "IIT Jodhpur",
    college_type: "IIT",
    city: "Jodhpur",
    state: "Rajasthan",
    country: "India",
    official_domain: "iitj.ac.in",
    email_domain: "iitj.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Patna",
    short_name: "IIT Patna",
    college_type: "IIT",
    city: "Patna",
    state: "Bihar",
    country: "India",
    official_domain: "iitp.ac.in",
    email_domain: "iitp.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Bhubaneswar",
    short_name: "IIT Bhubaneswar",
    college_type: "IIT",
    city: "Bhubaneswar",
    state: "Odisha",
    country: "India",
    official_domain: "iitbbs.ac.in",
    email_domain: "iitbbs.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Tirupati",
    short_name: "IIT Tirupati",
    college_type: "IIT",
    city: "Tirupati",
    state: "Andhra Pradesh",
    country: "India",
    official_domain: "iittp.ac.in",
    email_domain: "iittp.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Palakkad",
    short_name: "IIT Palakkad",
    college_type: "IIT",
    city: "Palakkad",
    state: "Kerala",
    country: "India",
    official_domain: "iitpkd.ac.in",
    email_domain: "iitpkd.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Goa",
    short_name: "IIT Goa",
    college_type: "IIT",
    city: "Ponda",
    state: "Goa",
    country: "India",
    official_domain: "iitgoa.ac.in",
    email_domain: "iitgoa.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Dharwad",
    short_name: "IIT Dharwad",
    college_type: "IIT",
    city: "Dharwad",
    state: "Karnataka",
    country: "India",
    official_domain: "iitdh.ac.in",
    email_domain: "iitdh.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Bhilai",
    short_name: "IIT Bhilai",
    college_type: "IIT",
    city: "Bhilai",
    state: "Chhattisgarh",
    country: "India",
    official_domain: "iitbhilai.ac.in",
    email_domain: "iitbhilai.ac.in"
  },
  {
    college_name: "Indian Institute of Technology Jammu",
    short_name: "IIT Jammu",
    college_type: "IIT",
    city: "Jammu",
    state: "Jammu and Kashmir",
    country: "India",
    official_domain: "iitjammu.ac.in",
    email_domain: "iitjammu.ac.in"
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. ALL NITs (31 Institutes + IIEST Shibpur + Student Mail)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    college_name: "National Institute of Technology Tiruchirappalli",
    short_name: "NIT Trichy",
    college_type: "NIT",
    city: "Tiruchirappalli",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "nitt.edu",
    email_domain: "nitt.edu"
  },
  {
    college_name: "National Institute of Technology Tiruchirappalli (Student Mail)",
    short_name: "NIT Trichy Students",
    college_type: "NIT",
    city: "Tiruchirappalli",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "nitt.edu",
    email_domain: "students.nitt.edu"
  },
  {
    college_name: "National Institute of Technology Karnataka, Surathkal",
    short_name: "NITK Surathkal",
    college_type: "NIT",
    city: "Mangalore",
    state: "Karnataka",
    country: "India",
    official_domain: "nitk.ac.in",
    email_domain: "nitk.ac.in"
  },
  {
    college_name: "National Institute of Technology Karnataka, Surathkal (Edu Domain)",
    short_name: "NITK Edu",
    college_type: "NIT",
    city: "Mangalore",
    state: "Karnataka",
    country: "India",
    official_domain: "nitk.edu.in",
    email_domain: "nitk.edu.in"
  },
  {
    college_name: "National Institute of Technology Rourkela",
    short_name: "NIT Rourkela",
    college_type: "NIT",
    city: "Rourkela",
    state: "Odisha",
    country: "India",
    official_domain: "nitrkl.ac.in",
    email_domain: "nitrkl.ac.in"
  },
  {
    college_name: "National Institute of Technology Warangal",
    short_name: "NIT Warangal",
    college_type: "NIT",
    city: "Warangal",
    state: "Telangana",
    country: "India",
    official_domain: "nitw.ac.in",
    email_domain: "nitw.ac.in"
  },
  {
    college_name: "National Institute of Technology Calicut",
    short_name: "NIT Calicut",
    college_type: "NIT",
    city: "Kozhikode",
    state: "Kerala",
    country: "India",
    official_domain: "nitc.ac.in",
    email_domain: "nitc.ac.in"
  },
  {
    college_name: "Visvesvaraya National Institute of Technology, Nagpur",
    short_name: "VNIT Nagpur",
    college_type: "NIT",
    city: "Nagpur",
    state: "Maharashtra",
    country: "India",
    official_domain: "vnit.ac.in",
    email_domain: "vnit.ac.in"
  },
  {
    college_name: "Malaviya National Institute of Technology Jaipur",
    short_name: "MNIT Jaipur",
    college_type: "NIT",
    city: "Jaipur",
    state: "Rajasthan",
    country: "India",
    official_domain: "mnit.ac.in",
    email_domain: "mnit.ac.in"
  },
  {
    college_name: "Motilal Nehru National Institute of Technology Allahabad",
    short_name: "MNNIT Prayagraj",
    college_type: "NIT",
    city: "Prayagraj",
    state: "Uttar Pradesh",
    country: "India",
    official_domain: "mnnit.ac.in",
    email_domain: "mnnit.ac.in"
  },
  {
    college_name: "National Institute of Technology Kurukshetra",
    short_name: "NIT Kurukshetra",
    college_type: "NIT",
    city: "Kurukshetra",
    state: "Haryana",
    country: "India",
    official_domain: "nitkkr.ac.in",
    email_domain: "nitkkr.ac.in"
  },
  {
    college_name: "National Institute of Technology Silchar",
    short_name: "NIT Silchar",
    college_type: "NIT",
    city: "Silchar",
    state: "Assam",
    country: "India",
    official_domain: "nits.ac.in",
    email_domain: "nits.ac.in"
  },
  {
    college_name: "National Institute of Technology Durgapur",
    short_name: "NIT Durgapur",
    college_type: "NIT",
    city: "Durgapur",
    state: "West Bengal",
    country: "India",
    official_domain: "nitdgp.ac.in",
    email_domain: "nitdgp.ac.in"
  },
  {
    college_name: "Sardar Vallabhbhai National Institute of Technology, Surat",
    short_name: "SVNIT Surat",
    college_type: "NIT",
    city: "Surat",
    state: "Gujarat",
    country: "India",
    official_domain: "svnit.ac.in",
    email_domain: "svnit.ac.in"
  },
  {
    college_name: "Maulana Azad National Institute of Technology Bhopal",
    short_name: "MANIT Bhopal",
    college_type: "NIT",
    city: "Bhopal",
    state: "Madhya Pradesh",
    country: "India",
    official_domain: "manit.ac.in",
    email_domain: "manit.ac.in"
  },
  {
    college_name: "National Institute of Technology Meghalaya",
    short_name: "NIT Meghalaya",
    college_type: "NIT",
    city: "Shillong",
    state: "Meghalaya",
    country: "India",
    official_domain: "nitm.ac.in",
    email_domain: "nitm.ac.in"
  },
  {
    college_name: "National Institute of Technology Raipur",
    short_name: "NIT Raipur",
    college_type: "NIT",
    city: "Raipur",
    state: "Chhattisgarh",
    country: "India",
    official_domain: "nitrr.ac.in",
    email_domain: "nitrr.ac.in"
  },
  {
    college_name: "National Institute of Technology Srinagar",
    short_name: "NIT Srinagar",
    college_type: "NIT",
    city: "Srinagar",
    state: "Jammu and Kashmir",
    country: "India",
    official_domain: "nitsri.ac.in",
    email_domain: "nitsri.ac.in"
  },
  {
    college_name: "Dr. B. R. Ambedkar National Institute of Technology Jalandhar",
    short_name: "NIT Jalandhar",
    college_type: "NIT",
    city: "Jalandhar",
    state: "Punjab",
    country: "India",
    official_domain: "nitj.ac.in",
    email_domain: "nitj.ac.in"
  },
  {
    college_name: "National Institute of Technology Goa",
    short_name: "NIT Goa",
    college_type: "NIT",
    city: "Ponda",
    state: "Goa",
    country: "India",
    official_domain: "nitgoa.ac.in",
    email_domain: "nitgoa.ac.in"
  },
  {
    college_name: "National Institute of Technology Jamshedpur",
    short_name: "NIT Jamshedpur",
    college_type: "NIT",
    city: "Jamshedpur",
    state: "Jharkhand",
    country: "India",
    official_domain: "nitjsr.ac.in",
    email_domain: "nitjsr.ac.in"
  },
  {
    college_name: "National Institute of Technology Patna",
    short_name: "NIT Patna",
    college_type: "NIT",
    city: "Patna",
    state: "Bihar",
    country: "India",
    official_domain: "nitp.ac.in",
    email_domain: "nitp.ac.in"
  },
  {
    college_name: "National Institute of Technology Hamirpur",
    short_name: "NIT Hamirpur",
    college_type: "NIT",
    city: "Hamirpur",
    state: "Himachal Pradesh",
    country: "India",
    official_domain: "nith.ac.in",
    email_domain: "nith.ac.in"
  },
  {
    college_name: "National Institute of Technology Puducherry",
    short_name: "NIT Puducherry",
    college_type: "NIT",
    city: "Karaikal",
    state: "Puducherry",
    country: "India",
    official_domain: "nitpy.ac.in",
    email_domain: "nitpy.ac.in"
  },
  {
    college_name: "National Institute of Technology Manipur",
    short_name: "NIT Manipur",
    college_type: "NIT",
    city: "Imphal",
    state: "Manipur",
    country: "India",
    official_domain: "nitmanipur.ac.in",
    email_domain: "nitmanipur.ac.in"
  },
  {
    college_name: "National Institute of Technology Mizoram",
    short_name: "NIT Mizoram",
    college_type: "NIT",
    city: "Aizawl",
    state: "Mizoram",
    country: "India",
    official_domain: "nitmz.ac.in",
    email_domain: "nitmz.ac.in"
  },
  {
    college_name: "National Institute of Technology Nagaland",
    short_name: "NIT Nagaland",
    college_type: "NIT",
    city: "Dimapur",
    state: "Nagaland",
    country: "India",
    official_domain: "nitnagaland.ac.in",
    email_domain: "nitnagaland.ac.in"
  },
  {
    college_name: "National Institute of Technology Uttarakhand",
    short_name: "NIT Uttarakhand",
    college_type: "NIT",
    city: "Srinagar (Garhwal)",
    state: "Uttarakhand",
    country: "India",
    official_domain: "nituk.ac.in",
    email_domain: "nituk.ac.in"
  },
  {
    college_name: "National Institute of Technology Arunachal Pradesh",
    short_name: "NIT Arunachal Pradesh",
    college_type: "NIT",
    city: "Yupia",
    state: "Arunachal Pradesh",
    country: "India",
    official_domain: "nitap.ac.in",
    email_domain: "nitap.ac.in"
  },
  {
    college_name: "National Institute of Technology Sikkim",
    short_name: "NIT Sikkim",
    college_type: "NIT",
    city: "Ravangla",
    state: "Sikkim",
    country: "India",
    official_domain: "nitsikkim.ac.in",
    email_domain: "nitsikkim.ac.in"
  },
  {
    college_name: "National Institute of Technology Delhi",
    short_name: "NIT Delhi",
    college_type: "NIT",
    city: "New Delhi",
    state: "Delhi",
    country: "India",
    official_domain: "nitdelhi.ac.in",
    email_domain: "nitdelhi.ac.in"
  },
  {
    college_name: "National Institute of Technology Andhra Pradesh",
    short_name: "NIT Andhra Pradesh",
    college_type: "NIT",
    city: "Tadepalligudem",
    state: "Andhra Pradesh",
    country: "India",
    official_domain: "nitandhra.ac.in",
    email_domain: "nitandhra.ac.in"
  },
  {
    college_name: "National Institute of Technology Agartala",
    short_name: "NIT Agartala",
    college_type: "NIT",
    city: "Agartala",
    state: "Tripura",
    country: "India",
    official_domain: "nita.ac.in",
    email_domain: "nita.ac.in"
  },
  {
    college_name: "Indian Institute of Engineering Science and Technology, Shibpur",
    short_name: "IIEST Shibpur",
    college_type: "NIT",
    city: "Howrah",
    state: "West Bengal",
    country: "India",
    official_domain: "iiests.ac.in",
    email_domain: "iiests.ac.in"
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. BANGALORE COLLEGES (ENGINEERING MAINLY)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    college_name: "Indian Institute of Science, Bangalore",
    short_name: "IISc Bangalore",
    college_type: "Institute of National Importance",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "iisc.ac.in",
    email_domain: "iisc.ac.in"
  },
  {
    college_name: "International Institute of Information Technology, Bangalore",
    short_name: "IIIT Bangalore",
    college_type: "Institute of National Importance",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "iiitb.ac.in",
    email_domain: "iiitb.ac.in"
  },
  {
    college_name: "R.V. College of Engineering",
    short_name: "RVCE",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "rvce.edu.in",
    email_domain: "rvce.edu.in"
  },
  {
    college_name: "B.M.S. College of Engineering",
    short_name: "BMSCE",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "bmsce.ac.in",
    email_domain: "bmsce.ac.in"
  },
  {
    college_name: "M.S. Ramaiah Institute of Technology",
    short_name: "MSRIT",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "msrit.edu",
    email_domain: "msrit.edu"
  },
  {
    college_name: "PES University, Ring Road Campus",
    short_name: "PESU",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "pes.edu",
    email_domain: "pes.edu"
  },
  {
    college_name: "PES University, Electronic City Campus",
    short_name: "PESU EC Campus",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "pes.edu",
    email_domain: "pesu.pes.edu"
  },
  {
    college_name: "Dayananda Sagar College of Engineering",
    short_name: "DSCE",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "dayanandasagar.edu.in",
    email_domain: "dayanandasagar.edu.in"
  },
  {
    college_name: "Dayananda Sagar College of Engineering (Alternate Domain)",
    short_name: "DSCE Edu",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "dsce.edu.in",
    email_domain: "dsce.edu.in"
  },
  {
    college_name: "Dayananda Sagar Academy of Technology and Management",
    short_name: "DSATM",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "dsatm.edu.in",
    email_domain: "dsatm.edu.in"
  },
  {
    college_name: "Dayananda Sagar University - School of Engineering",
    short_name: "DSU Bengaluru",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "dsu.edu.in",
    email_domain: "dsu.edu.in"
  },
  {
    college_name: "Bangalore Institute of Technology",
    short_name: "BIT Bangalore",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "bit-bangalore.edu.in",
    email_domain: "bit-bangalore.edu.in"
  },
  {
    college_name: "Sir M. Visvesvaraya Institute of Technology",
    short_name: "Sir MVIT",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "sirmvit.edu",
    email_domain: "sirmvit.edu"
  },
  {
    college_name: "New Horizon College of Engineering",
    short_name: "NHCE",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "newhorizonindia.edu",
    email_domain: "newhorizonindia.edu"
  },
  {
    college_name: "Nitte Meenakshi Institute of Technology",
    short_name: "NMIT",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "nmit.ac.in",
    email_domain: "nmit.ac.in"
  },
  {
    college_name: "CMR Institute of Technology",
    short_name: "CMRIT",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "cmrit.ac.in",
    email_domain: "cmrit.ac.in"
  },
  {
    college_name: "CMR University - School of Engineering and Technology",
    short_name: "CMRU Bengaluru",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "cmr.edu.in",
    email_domain: "cmr.edu.in"
  },
  {
    college_name: "B.M.S. Institute of Technology and Management",
    short_name: "BMSIT",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "bmsit.in",
    email_domain: "bmsit.in"
  },
  {
    college_name: "B.M.S. Institute of Technology and Management (AC Domain)",
    short_name: "BMSIT AC",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "bmsit.ac.in",
    email_domain: "bmsit.ac.in"
  },
  {
    college_name: "R.V. Institute of Technology and Management",
    short_name: "RVITM",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "rvitm.edu.in",
    email_domain: "rvitm.edu.in"
  },
  {
    college_name: "The Oxford College of Engineering",
    short_name: "Oxford College of Engineering",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "theoxford.edu",
    email_domain: "theoxford.edu"
  },
  {
    college_name: "Acharya Institute of Technology",
    short_name: "AIT Bengaluru",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "acharya.ac.in",
    email_domain: "acharya.ac.in"
  },
  {
    college_name: "Cambridge Institute of Technology",
    short_name: "CIT Bengaluru",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "cambridge.edu.in",
    email_domain: "cambridge.edu.in"
  },
  {
    college_name: "REVA University",
    short_name: "REVA",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "reva.edu.in",
    email_domain: "reva.edu.in"
  },
  {
    college_name: "Jain University - Faculty of Engineering and Technology",
    short_name: "Jain University",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "jainuniversity.ac.in",
    email_domain: "jainuniversity.ac.in"
  },
  {
    college_name: "Christ University - Faculty of Engineering",
    short_name: "Christ University",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "christuniversity.in",
    email_domain: "christuniversity.in"
  },
  {
    college_name: "Alliance University - College of Engineering and Design",
    short_name: "Alliance CED",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "alliance.edu.in",
    email_domain: "alliance.edu.in"
  },
  {
    college_name: "M.S. Ramaiah University of Applied Sciences",
    short_name: "RUAS",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "msruas.ac.in",
    email_domain: "msruas.ac.in"
  },
  {
    college_name: "Presidency University, Bengaluru",
    short_name: "Presidency Bengaluru",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "presidencyuniversity.in",
    email_domain: "presidencyuniversity.in"
  },
  {
    college_name: "SJB Institute of Technology",
    short_name: "SJBIT",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "sjbit.edu.in",
    email_domain: "sjbit.edu.in"
  },
  {
    college_name: "Don Bosco Institute of Technology, Bengaluru",
    short_name: "DBIT Bengaluru",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "dbit.co.in",
    email_domain: "dbit.co.in"
  },
  {
    college_name: "Global Academy of Technology",
    short_name: "GAT Bengaluru",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "gat.ac.in",
    email_domain: "gat.ac.in"
  },
  {
    college_name: "East West Institute of Technology",
    short_name: "EWIT",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "ewit.edu",
    email_domain: "ewit.edu"
  },
  {
    college_name: "MVJ College of Engineering",
    short_name: "MVJCE",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "mvjce.edu.in",
    email_domain: "mvjce.edu.in"
  },
  {
    college_name: "RNS Institute of Technology",
    short_name: "RNSIT",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "rnsit.ac.in",
    email_domain: "rnsit.ac.in"
  },
  {
    college_name: "K.S. Institute of Technology",
    short_name: "KSIT",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "ksit.ac.in",
    email_domain: "ksit.ac.in"
  },
  {
    college_name: "Gopalan College of Engineering and Management",
    short_name: "GCEM",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "gopalancolleges.com",
    email_domain: "gopalancolleges.com"
  },
  {
    college_name: "Atria Institute of Technology",
    short_name: "Atria IT",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "atria.edu",
    email_domain: "atria.edu"
  },
  {
    college_name: "B.N.M. Institute of Technology",
    short_name: "BNMIT",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "bnmit.org",
    email_domain: "bnmit.org"
  },
  {
    college_name: "Dr. Ambedkar Institute of Technology",
    short_name: "Dr. AIT",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "drait.edu.in",
    email_domain: "drait.edu.in"
  },
  {
    college_name: "AMC Engineering College",
    short_name: "AMC Engineering College",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "amcgroup.edu.in",
    email_domain: "amcgroup.edu.in"
  },
  {
    college_name: "JSS Academy of Technical Education, Bengaluru",
    short_name: "JSSATE Bengaluru",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "jssateb.ac.in",
    email_domain: "jssateb.ac.in"
  },
  {
    college_name: "University Visvesvaraya College of Engineering",
    short_name: "UVCE",
    college_type: "Government Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "uvce.ac.in",
    email_domain: "uvce.ac.in"
  },
  {
    college_name: "Amrita Vishwa Vidyapeetham, Bengaluru Campus",
    short_name: "Amrita Bengaluru",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "amrita.edu",
    email_domain: "blr.amrita.edu"
  },
  {
    college_name: "Amrita Vishwa Vidyapeetham, Bengaluru (Student Mail)",
    short_name: "Amrita Bengaluru Students",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "amrita.edu",
    email_domain: "blr.students.amrita.edu"
  },
  {
    college_name: "GITAM University, Bengaluru Campus",
    short_name: "GITAM Bengaluru",
    college_type: "Private Engineering",
    city: "Bengaluru",
    state: "Karnataka",
    country: "India",
    official_domain: "gitam.edu",
    email_domain: "gitam.in"
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // 4. CHENNAI COLLEGES (ENGINEERING MAINLY)
  // ─────────────────────────────────────────────────────────────────────────────
  {
    college_name: "SRM Institute of Science and Technology, Kattankulathur",
    short_name: "SRM KTR",
    college_type: "Private Engineering",
    city: "Kattankulathur",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "srmist.edu.in",
    email_domain: "srmist.edu.in"
  },
  {
    college_name: "SRM Institute of Science and Technology, Ramapuram",
    short_name: "SRM Ramapuram",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "srmist.edu.in",
    email_domain: "srmist.edu.in"
  },
  {
    college_name: "SRM Institute of Science and Technology, Vadapalani",
    short_name: "SRM Vadapalani",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "srmist.edu.in",
    email_domain: "srmist.edu.in"
  },
  {
    college_name: "College of Engineering, Guindy (Anna University)",
    short_name: "CEG Guindy",
    college_type: "Government Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "ceg.annauniv.edu",
    email_domain: "annauniv.edu"
  },
  {
    college_name: "Madras Institute of Technology, Chromepet (Anna University)",
    short_name: "MIT Chromepet",
    college_type: "Government Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "mitindia.edu",
    email_domain: "mitindia.edu"
  },
  {
    college_name: "Alagappa Chettiar College of Technology (Anna University)",
    short_name: "AC Tech Guindy",
    college_type: "Government Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "act.annauniv.edu",
    email_domain: "act.annauniv.edu"
  },
  {
    college_name: "SSN College of Engineering",
    short_name: "SSNCE",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "ssn.edu.in",
    email_domain: "ssn.edu.in"
  },
  {
    college_name: "Shiv Nadar University Chennai",
    short_name: "SNU Chennai",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "snuchennai.edu.in",
    email_domain: "snuchennai.edu.in"
  },
  {
    college_name: "Vellore Institute of Technology, Chennai",
    short_name: "VIT Chennai",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "vit.ac.in",
    email_domain: "vit.ac.in"
  },
  {
    college_name: "Chennai Institute of Technology",
    short_name: "CIT Chennai",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "citchennai.edu.in",
    email_domain: "citchennai.net"
  },
  {
    college_name: "Chennai Institute of Technology (Edu Domain)",
    short_name: "CIT Chennai Edu",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "citchennai.edu.in",
    email_domain: "citchennai.edu.in"
  },
  {
    college_name: "Rajalakshmi Engineering College",
    short_name: "REC Chennai",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "rajalakshmi.edu.in",
    email_domain: "rajalakshmi.edu.in"
  },
  {
    college_name: "Rajalakshmi Engineering College (Org Domain)",
    short_name: "REC Chennai Org",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "rajalakshmi.org",
    email_domain: "rajalakshmi.org"
  },
  {
    college_name: "Rajalakshmi Institute of Technology",
    short_name: "RIT Chennai",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "ritchennai.org",
    email_domain: "ritchennai.edu.in"
  },
  {
    college_name: "Sri Venkateswara College of Engineering",
    short_name: "SVCE Sriperumbudur",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "svce.ac.in",
    email_domain: "svce.ac.in"
  },
  {
    college_name: "St. Joseph's College of Engineering",
    short_name: "St. Joseph's Engineering",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "stjosephs.ac.in",
    email_domain: "stjosephs.ac.in"
  },
  {
    college_name: "St. Joseph's Institute of Technology",
    short_name: "St. Joseph's IT",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "stjosephstechnology.ac.in",
    email_domain: "stjosephstechnology.ac.in"
  },
  {
    college_name: "Sathyabama Institute of Science and Technology",
    short_name: "Sathyabama",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "sathyabama.ac.in",
    email_domain: "sathyabama.ac.in"
  },
  {
    college_name: "Hindustan Institute of Technology and Science",
    short_name: "HITS",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "hindustanuniv.ac.in",
    email_domain: "hindustanuniv.ac.in"
  },
  {
    college_name: "B.S. Abdur Rahman Crescent Institute of Science and Technology",
    short_name: "Crescent University",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "crescent.education",
    email_domain: "crescent.education"
  },
  {
    college_name: "Saveetha Engineering College",
    short_name: "Saveetha Engineering College",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "saveetha.ac.in",
    email_domain: "saveetha.ac.in"
  },
  {
    college_name: "Saveetha Institute of Medical and Technical Sciences",
    short_name: "SIMATS",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "saveetha.com",
    email_domain: "saveetha.com"
  },
  {
    college_name: "Meenakshi Sundararajan Engineering College",
    short_name: "MSEC Chennai",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "msec.edu.in",
    email_domain: "msec.edu.in"
  },
  {
    college_name: "Panimalar Engineering College",
    short_name: "Panimalar Engineering",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "panimalar.ac.in",
    email_domain: "panimalar.ac.in"
  },
  {
    college_name: "Easwari Engineering College (SRM Group)",
    short_name: "Easwari Engineering College",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "srmeaswari.ac.in",
    email_domain: "srmeaswari.ac.in"
  },
  {
    college_name: "Loyola-ICAM College of Engineering and Technology",
    short_name: "LICET",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "licet.ac.in",
    email_domain: "licet.ac.in"
  },
  {
    college_name: "Sri Sairam Engineering College",
    short_name: "Sri Sairam Engineering",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "sairam.edu.in",
    email_domain: "sairam.edu.in"
  },
  {
    college_name: "Sri Sairam Engineering College (SEC Domain)",
    short_name: "Sri Sairam SEC",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "sairam.edu.in",
    email_domain: "sec.sairam.edu.in"
  },
  {
    college_name: "Sri Sairam Institute of Technology",
    short_name: "Sri Sairam IT",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "sairamit.edu.in",
    email_domain: "sairamit.edu.in"
  },
  {
    college_name: "RMK Engineering College",
    short_name: "RMK Engineering College",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "rmkec.ac.in",
    email_domain: "rmkec.ac.in"
  },
  {
    college_name: "R.M.D. Engineering College",
    short_name: "RMD Engineering College",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "rmd.ac.in",
    email_domain: "rmd.ac.in"
  },
  {
    college_name: "RMK College of Engineering and Technology",
    short_name: "RMKCET",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "rmkcet.ac.in",
    email_domain: "rmkcet.ac.in"
  },
  {
    college_name: "Vel Tech Rangarajan Dr. Sagunthala R&D Institute of Science and Technology",
    short_name: "Vel Tech",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "veltech.edu.in",
    email_domain: "veltech.edu.in"
  },
  {
    college_name: "Vel Tech High Tech Dr. Rangarajan Dr. Sakunthala Engineering College",
    short_name: "Vel Tech High Tech",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "velhightech.com",
    email_domain: "velhightech.com"
  },
  {
    college_name: "Vel Tech Multi Tech Dr. Rangarajan Dr. Sakunthala Engineering College",
    short_name: "Vel Tech Multi Tech",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "velmultitech.com",
    email_domain: "velmultitech.com"
  },
  {
    college_name: "KCG College of Technology",
    short_name: "KCG College of Technology",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "kcgcollege.ac.in",
    email_domain: "kcgcollege.ac.in"
  },
  {
    college_name: "Jerusalem College of Engineering",
    short_name: "Jerusalem Engineering College",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "jerusalemengg.ac.in",
    email_domain: "jerusalemengg.ac.in"
  },
  {
    college_name: "Dhanalakshmi College of Engineering",
    short_name: "Dhanalakshmi Engineering",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "dce.edu.in",
    email_domain: "dce.edu.in"
  },
  {
    college_name: "Agni College of Technology",
    short_name: "Agni College of Technology",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "act.edu.in",
    email_domain: "act.edu.in"
  },
  {
    college_name: "Anand Institute of Higher Technology",
    short_name: "AIHT Chennai",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "aiht.ac.in",
    email_domain: "aiht.ac.in"
  },
  {
    college_name: "Jeppiaar Engineering College",
    short_name: "Jeppiaar Engineering",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "jeppiaarcollege.org",
    email_domain: "jeppiaarcollege.org"
  },
  {
    college_name: "Jeppiaar Institute of Technology",
    short_name: "Jeppiaar Institute of Technology",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "jeppiaartech.org",
    email_domain: "jeppiaartech.org"
  },
  {
    college_name: "Velammal Engineering College",
    short_name: "Velammal Engineering",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "velammal.edu.in",
    email_domain: "velammal.edu.in"
  },
  {
    college_name: "Velammal Institute of Technology",
    short_name: "Velammal Institute of Technology",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "velammalitech.edu.in",
    email_domain: "velammalitech.edu.in"
  },
  {
    college_name: "Prathyusha Engineering College",
    short_name: "Prathyusha Engineering",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "prathyusha.edu.in",
    email_domain: "prathyusha.edu.in"
  },
  {
    college_name: "Indian Institute of Information Technology, Design and Manufacturing, Kancheepuram",
    short_name: "IIITDM Kancheepuram",
    college_type: "Institute of National Importance",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "iiitdm.ac.in",
    email_domain: "iiitdm.ac.in"
  },
  {
    college_name: "Vels Institute of Science, Technology & Advanced Studies",
    short_name: "Vels University",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "velsuniv.ac.in",
    email_domain: "velsuniv.ac.in"
  },
  {
    college_name: "Bharath Institute of Higher Education and Research",
    short_name: "BIHER",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "bharathuniv.ac.in",
    email_domain: "bharathuniv.ac.in"
  },
  {
    college_name: "Amrita Vishwa Vidyapeetham, Chennai Campus",
    short_name: "Amrita Chennai",
    college_type: "Private Engineering",
    city: "Chennai",
    state: "Tamil Nadu",
    country: "India",
    official_domain: "amrita.edu",
    email_domain: "ch.amrita.edu"
  }
];

async function main() {
  console.log(`[SEED] Processing ${TARGET_COLLEGES.length} target colleges...`);

  // Fetch all existing colleges once
  const existingColleges = await prisma.college.findMany();
  console.log(`[DB] Fetched ${existingColleges.length} existing colleges from DB.`);

  const domainMap = new Map();
  const nameCityMap = new Map();

  existingColleges.forEach((c) => {
    if (c.emailDomain) domainMap.set(c.emailDomain.trim().toLowerCase(), c);
    const key = `${c.collegeName.trim().toLowerCase()}||${c.city.trim().toLowerCase()}`;
    nameCityMap.set(key, c);
  });

  const toCreate = [];
  const toUpdate = [];

  for (const c of TARGET_COLLEGES) {
    const domainKey = c.email_domain ? c.email_domain.trim().toLowerCase() : null;
    const nameCityKey = `${c.college_name.trim().toLowerCase()}||${c.city.trim().toLowerCase()}`;

    const match = (domainKey && domainMap.get(domainKey)) || nameCityMap.get(nameCityKey);

    if (match) {
      toUpdate.push({
        id: match.id,
        data: {
          collegeName: c.college_name,
          shortName: c.short_name,
          collegeType: c.college_type,
          city: c.city,
          state: c.state,
          country: c.country,
          officialDomain: c.official_domain,
          emailDomain: c.email_domain
        }
      });
    } else {
      toCreate.push({
        collegeName: c.college_name,
        shortName: c.short_name,
        collegeType: c.college_type,
        city: c.city,
        state: c.state,
        country: c.country,
        officialDomain: c.official_domain,
        emailDomain: c.email_domain
      });
      // prevent duplicate creations in same run
      if (domainKey) domainMap.set(domainKey, c);
      nameCityMap.set(nameCityKey, c);
    }
  }

  console.log(`[PLAN] Creating ${toCreate.length} new colleges, updating ${toUpdate.length} existing colleges.`);

  if (toCreate.length > 0) {
    await prisma.college.createMany({
      data: toCreate
    });
    console.log(`[OK] Created ${toCreate.length} new colleges.`);
  }

  // Update in chunks
  for (const item of toUpdate) {
    await prisma.college.update({
      where: { id: item.id },
      data: item.data
    });
  }
  console.log(`[OK] Updated ${toUpdate.length} colleges.`);

  // Also update backend/src/data/colleges.json and frontend/backend/src/data/colleges.json
  const jsonPaths = [
    path.resolve(__dirname, "../src/data/colleges.json"),
    path.resolve(__dirname, "../../frontend/backend/src/data/colleges.json")
  ];

  for (const p of jsonPaths) {
    try {
      if (!fs.existsSync(p)) continue;
      const fileData = JSON.parse(fs.readFileSync(p, "utf-8"));
      const mapByDomain = new Map();
      fileData.forEach((item) => {
        if (item.email_domain) mapByDomain.set(item.email_domain.toLowerCase(), item);
      });

      TARGET_COLLEGES.forEach((target) => {
        const key = target.email_domain.toLowerCase();
        if (mapByDomain.has(key)) {
          Object.assign(mapByDomain.get(key), target);
        } else {
          fileData.push(target);
          mapByDomain.set(key, target);
        }
      });

      fs.writeFileSync(p, JSON.stringify(fileData, null, 2), "utf-8");
      console.log(`[OK] Updated JSON file: ${p} (Total colleges: ${fileData.length})`);
    } catch (e) {
      console.warn(`[WARN] Could not update JSON file ${p}:`, e.message);
    }
  }
}

main()
  .catch((e) => {
    console.error("[ERROR]", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
