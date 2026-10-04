import type { ReportInsert } from './types';
import { analyzeReport } from './analyzer';

const SITES = [
  'Mumbai High North',
  'Mumbai High South',
  'Bassein & Satellite',
  'Heera Asset',
  'Neelam & Heera',
  'Uran Plant',
  'Hazira Plant',
  'Dadra Asset',
  'South Tapti',
  'CBM Bokaro',
];

const REPORT_TYPES = ['UA/UC', 'Near-miss', 'Incident'];

interface SeedTemplate {
  narrative: string;
  site: string;
  reportType: string;
}

const SEED_TEMPLATES: SeedTemplate[] = [
  // Energy Isolation - failures
  { site: 'Mumbai High North', reportType: 'Near-miss', narrative: 'During maintenance of a crude oil transfer line, the team isolated the section but did not verify zero pressure before loosening the flange. Trapped pressure was released when the flange was opened. Nobody was injured but the release could have caused serious harm.' },
  { site: 'Bassein & Satellite', reportType: 'UA/UC', narrative: 'A technician was observed opening a valve on a pressurized gas line without confirming that the upstream isolation valve was fully closed. No lockout tag was applied to the isolation valve during the work.' },
  { site: 'Heera Asset', reportType: 'Near-miss', narrative: 'While replacing a section of pipeline, workers depressurized the line but did not verify zero energy state before cutting the pipe. Residual pressure caused a sudden release of hydrocarbon vapour when the cut was made.' },
  { site: 'Uran Plant', reportType: 'Incident', narrative: 'During pump maintenance, the electrical isolation was removed before the mechanical team completed work on the pump casing. The pump started unexpectedly, causing a worker to narrowly avoid contact with rotating equipment.' },
  { site: 'Mumbai High South', reportType: 'UA/UC', narrative: 'A contractor was found working on a compressor without lockout tagout. The isolation permit had expired but work continued without renewal. Stored energy in the compressor was not released before opening the casing.' },
  { site: 'Hazira Plant', reportType: 'Near-miss', narrative: 'During valve replacement on a gas pipeline, the team failed to verify zero pressure after isolation. When the valve was removed, trapped gas escaped, causing the technician to step back and slip on the platform.' },
  { site: 'Neelam & Heera', reportType: 'UA/UC', narrative: 'Workers were observed performing maintenance on a heat exchanger without confirming depressurization. The blinds had not been installed and the system was not verified to be at zero energy state before work commenced.' },
  { site: 'Mumbai High North', reportType: 'Near-miss', narrative: 'A flange on a high-pressure separator was opened without proper isolation verification. The technician assumed the line was depressurized but residual pressure blew out the gasket upon flange separation.' },
  { site: 'Dadra Asset', reportType: 'Incident', narrative: 'During isolation of a gas injection line, the operator did not follow the lockout procedure. When maintenance began on the valve actuator, the line was still pressurized. The actuator moved under pressure, striking the technician on the hand.' },
  { site: 'Bassein & Satellite', reportType: 'UA/UC', narrative: 'A mechanic removed a blind flange from a process line without verifying that the line had been isolated and depressurized. The permit stated isolation was complete but no zero-energy verification was documented.' },

  // Energy Isolation - successful barriers
  { site: 'Mumbai High North', reportType: 'UA/UC', narrative: 'The electrical supply to the pump was isolated and locked out. The technician tested the equipment and confirmed zero energy before starting maintenance. All procedures were followed correctly.' },
  { site: 'Heera Asset', reportType: 'Near-miss', narrative: 'During pipeline maintenance, the team isolated the section, locked out all energy sources, and verified zero pressure with a calibrated gauge before opening the flange. The work proceeded safely without incident.' },
  { site: 'Uran Plant', reportType: 'UA/UC', narrative: 'A positive observation: before servicing the compressor, the technician applied lockout tagout, verified zero energy at the terminals, and confirmed the depressurization with the operator before opening the casing.' },

  // Working at Height
  { site: 'Mumbai High South', reportType: 'Near-miss', narrative: 'A scaffolding platform was being used for inspection work on the flare tower. One section of the guardrail was missing. No alternative fall protection was being used. The inspector was working at 15 meters elevation without a harness.' },
  { site: 'Neelam & Heera', reportType: 'UA/UC', narrative: 'Workers were observed on the process deck roof without fall protection harnesses. The edge of the roof had no guardrail in place on the southern side. The workers were within 2 meters of the unprotected edge.' },
  { site: 'Bassein & Satellite', reportType: 'Incident', narrative: 'A rigger fell from a platform at 8 meters height while preparing a lifting operation. The guardrail on the platform had been removed for material access and not replaced. The rigger was not wearing a safety harness.' },
  { site: 'Mumbai High North', reportType: 'Near-miss', narrative: 'During maintenance of the flare boom, a technician climbed the structure without securing his lanyard to an anchor point. The fixed ladder had damaged rungs and no fall arrest system was in use.' },
  { site: 'Hazira Plant', reportType: 'UA/UC', narrative: 'Two contractors were working on the roof of the control building replacing ventilation equipment. No edge protection was installed and neither worker was using a harness or any form of fall protection.' },
  { site: 'Heera Asset', reportType: 'Near-miss', narrative: 'A worker was on an elevated platform when the handrail gave way. The worker grabbed an adjacent pipe to avoid falling. The platform was at 12 meters. No harness was worn at the time.' },
  { site: 'South Tapti', reportType: 'UA/UC', narrative: 'Scaffolding erected for painting work had incomplete guardrails on one side. Workers were accessing the platform without clipping on to the safety line. The scaffold tag had expired.' },

  // Hot Work
  { site: 'Uran Plant', reportType: 'Near-miss', narrative: 'Welding was being performed near a process line containing hydrocarbon residue. Gas testing had not been completed before welding started. The area had not been cleared of combustible materials and no fire watch was posted.' },
  { site: 'Mumbai High North', reportType: 'Incident', narrative: 'A flash fire occurred during grinding work on a pipeline. The line had not been purged or gas tested before the hot work began. The welder sustained minor burns. The hot work permit did not specify gas testing requirements.' },
  { site: 'Bassein & Satellite', reportType: 'UA/UC', narrative: 'Hot work was in progress on the process deck without a valid permit. No gas testing had been conducted and no fire watch was assigned. Welding sparks were observed falling toward a drain containing hydrocarbon traces.' },
  { site: 'Hazira Plant', reportType: 'Near-miss', narrative: 'A welder was cutting a pipe section near a storage tank that had contained flammable liquid. No vapour testing was performed. Residual vapours ignited briefly but self-extinguished. The area had not been cleared per hot work permit requirements.' },
  { site: 'Neelam & Heera', reportType: 'UA/UC', narrative: 'Grinding sparks were observed near an open drain containing oil residue. The hot work permit was expired and no gas testing had been done that shift. No fire watch was present.' },
  { site: 'Mumbai High South', reportType: 'Near-miss', narrative: 'During welding repairs on a structural member, sparks fell onto a tarpaulin covering a cable tray. The tarpaulin began smoldering. No fire watch was posted and the area had not been cleared of combustibles before hot work.' },
  { site: 'South Tapti', reportType: 'Incident', narrative: 'A small explosion occurred during welding on a section of pipework that had not been properly isolated or purged. The welding team had not verified that the line was free of flammable content. One worker received burns to the face.' },

  // Confined Space
  { site: 'Mumbai High North', reportType: 'Near-miss', narrative: 'A worker entered a storage vessel for cleaning. A confined space entry permit had been issued but atmospheric testing was not performed. The worker entered the vessel before the job was stopped by a supervisor.' },
  { site: 'Bassein & Satellite', reportType: 'Incident', narrative: 'A maintenance technician entered a separator vessel without atmospheric testing. The vessel had been opened but not purged or ventilated. The worker collapsed inside and was rescued by a standby person who was not wearing breathing apparatus.' },
  { site: 'Uran Plant', reportType: 'UA/UC', narrative: 'Two workers entered a drainage sump without a confined space entry permit. No gas testing was conducted and no attendant was stationed outside. The sump atmosphere was not verified to be safe for entry.' },
  { site: 'Hazira Plant', reportType: 'Near-miss', narrative: 'During internal inspection of a storage tank, the entry team did not perform continuous atmospheric monitoring. The initial gas test was done 30 minutes before entry but no verification was done at the time of actual entry.' },
  { site: 'Heera Asset', reportType: 'UA/UC', narrative: 'A contractor was observed entering a manhole without testing the atmosphere or wearing a harness. No rescue plan was in place and no hole watch was assigned. The confined space permit was not completed.' },
  { site: 'Neelam & Heera', reportType: 'Incident', narrative: 'A worker entered a process vessel to retrieve a dropped tool. No permit, no gas testing, and no attendant. The vessel contained residual nitrogen. The worker was overcome but was extracted by emergency response.' },
  { site: 'Mumbai High South', reportType: 'Near-miss', narrative: 'During vessel entry for internal coating inspection, the ventilation blower was not running. Atmospheric testing showed low oxygen levels but entry proceeded anyway before the atmosphere was corrected.' },

  // Lifting Operations
  { site: 'Mumbai High North', reportType: 'Near-miss', narrative: 'A crane was lifting a 5-tonne module when the sling slipped, causing the load to swing uncontrollably. The tag line was not being used and the exclusion zone had not been established. Workers were standing beneath the suspended load.' },
  { site: 'Bassein & Satellite', reportType: 'Incident', narrative: 'A lifting sling failed during a pipe-lifting operation, causing the load to drop onto the deck. The sling was damaged and had not been inspected before use. No lift plan was in place for the operation.' },
  { site: 'Hazira Plant', reportType: 'UA/UC', narrative: 'A forklift was operating near a process area without an exclusion zone. Pedestrians were walking through the lifting area. The load being carried obstructed the operator forward view and no banksman was assigned.' },
  { site: 'Neelam & Heera', reportType: 'Near-miss', narrative: 'During a crane lift of a heat exchanger bundle, the rigging was found to be undersized for the load. The lift proceeded without a valid lift plan or load chart verification. The rigging stretched but did not fail.' },
  { site: 'Mumbai High South', reportType: 'UA/UC', narrative: 'Workers were observed walking under a suspended load during pipe installation. The crane operator did not stop the lift. No tag lines were being used and the exclusion zone barriers had been removed.' },
  { site: 'South Tapti', reportType: 'Near-miss', narrative: 'A winch cable snapped during lifting of equipment onto the platform deck. The cable had not been inspected and was found to have broken wires. No exclusion zone was in place and a worker narrowly avoided the snapped cable.' },

  // Line of Fire
  { site: 'Mumbai High North', reportType: 'Near-miss', narrative: 'A worker was standing between a reversing truck and a fixed structure. The truck did not have a reversing alarm functioning and no banksman was present. The worker was alerted by a colleague just before being pinned.' },
  { site: 'Heera Asset', reportType: 'Incident', narrative: 'A pipe section fell from a fork lift during material handling, striking a worker on the shoulder. The load was not secured and the worker was standing in the line of fire next to the forklift.' },
  { site: 'Bassein & Satellite', reportType: 'UA/UC', narrative: 'Workers were observed in the swing radius of an excavator during trenching work. No exclusion zone was established. The excavator operator had limited visibility and a spotter was not assigned.' },
  { site: 'Uran Plant', reportType: 'Near-miss', narrative: 'During removal of a heavy valve, the chain block shifted and the valve swung, narrowly missing a technician standing in the line of fire. No exclusion zone had been established and the technician was not positioned in a safe location.' },

  // Low risk / housekeeping
  { site: 'Mumbai High North', reportType: 'UA/UC', narrative: 'Several loose papers were found near the entrance of the control room. They were removed immediately. Minor housekeeping issue.' },
  { site: 'Uran Plant', reportType: 'UA/UC', narrative: 'A small oil spill was observed on the walkway near the pump house. It was cleaned up immediately. No one was affected.' },
  { site: 'Hazira Plant', reportType: 'UA/UC', narrative: 'A tripping hazard was identified where a cable was running across a corridor. Cable cover was installed the same day.' },
  { site: 'Bassein & Satellite', reportType: 'UA/UC', narrative: 'Poor lighting was reported in the stairwell of the accommodation block. Maintenance was notified and the lights were replaced.' },
  { site: 'Mumbai High South', reportType: 'UA/UC', narrative: 'A damaged safety sign was found at the entrance to the warehouse. It was replaced within the hour. Minor signage issue.' },

  // Mixed / complex scenarios for variety
  { site: 'Mumbai High North', reportType: 'Near-miss', narrative: 'During a pipeline tie-in operation, the team isolated the main line but did not install blinds. While welding the tie-in, residual gas from the non-blinded section caused a small flash. The welder was not injured but the incident highlights both isolation and hot work failures.' },
  { site: 'Neelam & Heera', reportType: 'Near-miss', narrative: 'A scaffold platform at 20 meters had a missing guardrail and the worker on it was not wearing a harness. At the same time, a crane was lifting materials nearby with no exclusion zone. Multiple hazards were present simultaneously.' },
  { site: 'Bassein & Satellite', reportType: 'Near-miss', narrative: 'During vessel entry for internal inspection, the atmospheric testing was not completed. Additionally, the standby person left the area. The worker inside reported dizziness before being assisted out.' },
  { site: 'Heera Asset', reportType: 'UA/UC', narrative: 'Hot work was being conducted near a confined space opening. No gas testing was performed for either the hot work or the confined space. A combined permit was not in use and no fire watch or hole watch was assigned.' },
  { site: 'Uran Plant', reportType: 'Near-miss', narrative: 'A lifting operation was in progress with an undersized sling while workers stood under the load. The sling began to fail but the load was lowered safely. No lift plan and no exclusion zone were in place.' },
  { site: 'Hazira Plant', reportType: 'Near-miss', narrative: 'During maintenance of a high-pressure gas compressor, the isolation was not verified. The technician opened the casing without confirming zero energy. Residual gas pressure caused the casing to move, narrowly missing the technician hands.' },
  { site: 'South Tapti', reportType: 'UA/UC', narrative: 'A contractor was observed working on a valve without isolation, while hot work was being performed nearby. Gas testing was not conducted. The valve was on an active process line with no lockout tagout applied.' },
  { site: 'Mumbai High North', reportType: 'Near-miss', narrative: 'During a plant turnaround, a worker entered a column without a permit or atmospheric testing. At the same time, welding was being done on a connected line that had not been isolated. Multiple safety barriers were bypassed.' },
  { site: 'Dadra Asset', reportType: 'UA/UC', narrative: 'A crane operator lifted a container over the process area while workers were still in the exclusion zone. The load shifted due to improper rigging. No lift plan was documented for this operation.' },
  { site: 'Mumbai High South', reportType: 'Near-miss', narrative: 'A mechanic was changing a valve on a live process line. The line was not isolated because production did not want to shut down. The mechanic was exposed to pressurized hydrocarbon while removing the valve flange.' },
  { site: 'Bassein & Satellite', reportType: 'UA/UC', narrative: 'During scaffolding work near the flare stack, workers were at height without harnesses. The scaffolding was incomplete and no guardrails were installed on the working level.' },
  { site: 'Neelam & Heera', reportType: 'Near-miss', narrative: 'A technician entered a separator to clean the internal components. No atmospheric testing was done and the vessel had not been purged. The entry permit was signed without verification. The technician felt dizzy and exited on their own.' },
  { site: 'Heera Asset', reportType: 'UA/UC', narrative: 'Welding was observed on a pipe rack without a fire watch. The area below had oil residue and no gas testing was performed. The hot work permit was not displayed at the worksite.' },
  { site: 'Uran Plant', reportType: 'Near-miss', narrative: 'During removal of a pump, the lifting chain slipped off the hook. The pump dropped 3 meters to the deck. No exclusion zone was established and a worker was 2 meters from the drop point.' },
  { site: 'Mumbai High North', reportType: 'UA/UC', narrative: 'Workers were performing grinding on a deck above a storage area containing flammable materials. No gas testing, no fire watch, and no cleanup of combustibles was done before the grinding started.' },
  { site: 'Hazira Plant', reportType: 'Near-miss', narrative: 'A maintenance team was working on a gas compressor that had not been fully isolated. The team relied on valve closure without lockout. When they opened the casing, residual pressure released gas into the work area.' },
  { site: 'Bassein & Satellite', reportType: 'UA/UC', narrative: 'A worker was spotted on top of a storage tank without fall protection. The tank roof had corroded sections and no guardrail. The worker was inspecting the roof for integrity.' },
  { site: 'Mumbai High South', reportType: 'Near-miss', narrative: 'During confined space entry into a drainage tank, the ventilation blower failed. The standby person did not stop the work. The entrant continued working without atmospheric monitoring until noticing difficulty breathing.' },
  { site: 'South Tapti', reportType: 'UA/UC', narrative: 'A forklift was moving pipes through a walkway where pedestrians were present. No banksman was assigned and the load was unstable. A pipe shifted and nearly struck a worker standing nearby.' },
  { site: 'Neelam & Heera', reportType: 'Near-miss', narrative: 'During isolation of a gas line for maintenance, the operator closed the valve but did not lock it. A colleague inadvertently opened the valve while maintenance was in progress. Gas flowed to the work area but was detected before injury.' },
  { site: 'Mumbai High North', reportType: 'UA/UC', narrative: 'A scaffold erector was working at 18 meters without a harness. The scaffold was being dismantled and no guardrail remained on the working level. The erector was climbing on the frame without fall protection.' },
  { site: 'Heera Asset', reportType: 'Near-miss', narrative: 'Hot work was being conducted on a vessel that had contained hydrocarbon. The vessel was not purged. Gas testing showed 20% LEL but welding proceeded. No fire watch was in place.' },
  { site: 'Uran Plant', reportType: 'UA/UC', narrative: 'A lifting operation using a crane was being performed without a valid lift plan. The load exceeded the rated capacity of the sling. No exclusion zone was established and the rigger was not certified.' },
  { site: 'Bassein & Satellite', reportType: 'Near-miss', narrative: 'During maintenance on a high-pressure separator, the blinds were not installed after isolation. The team verified zero pressure but did not lock out the isolation valve. A process upset re-pressurized the line while work was in progress.' },
  { site: 'Mumbai High South', reportType: 'Incident', narrative: 'A worker entered a confined space without testing. The atmosphere was oxygen deficient. The worker collapsed and was rescued by emergency response team with breathing apparatus. The entry permit had not been completed.' },
  { site: 'Hazira Plant', reportType: 'UA/UC', narrative: 'A crane was operating near overhead power lines. No exclusion zone was established and no banksman was present. The crane boom came within 2 meters of the power line during the lift.' },
  { site: 'Neelam & Heera', reportType: 'Near-miss', narrative: 'During a turnaround, a team was working on a heat exchanger without verifying isolation. The lockout tagout was applied to the wrong valve. The team opened the exchanger header while the line was still pressurized with hot fluid.' },
  { site: 'Dadra Asset', reportType: 'UA/UC', narrative: 'A contractor was observed grinding near an open sump containing hydrocarbon residue. No gas testing was conducted and no fire watch was posted. Sparks were falling toward the sump opening.' },
  { site: 'Mumbai High North', reportType: 'Near-miss', narrative: 'A rigger was working on top of a container at height without a harness. The container was being prepared for lifting. The rigger was attaching the sling while standing on an unguarded edge at 6 meters.' },
  { site: 'Bassein & Satellite', reportType: 'UA/UC', narrative: 'During pipeline pigging operations, the pig trap was opened without verifying that the line was depressurized. No isolation confirmation was done. The operator assumed the line was clear based on pressure readings from a different location.' },
  { site: 'South Tapti', reportType: 'Near-miss', narrative: 'A worker was inside a vessel conducting welding repairs. The confined space had not been tested for atmosphere and the welding was being done without a hot work permit. No standby person was stationed outside.' },
  { site: 'Mumbai High South', reportType: 'UA/UC', narrative: 'A vehicle was reversing in the processing area without a functioning reverse alarm. Workers were in the area and no banksman was assigned. The vehicle came within 1 meter of a worker before stopping.' },
  { site: 'Heera Asset', reportType: 'Near-miss', narrative: 'During valve maintenance on a gas injection line, the team did not perform zero-energy verification. The isolation was done at the control room but no local verification was done at the valve. When the valve was removed, gas escaped under pressure.' },
  { site: 'Uran Plant', reportType: 'UA/UC', narrative: 'Two workers were on a scaffold platform at 10 meters. One section of the platform decking was missing and no guardrail was present on that side. Neither worker was clipped on to a safety line.' },
  { site: 'Hazira Plant', reportType: 'Near-miss', narrative: 'A crane was lifting a heavy vessel section when the rigging configuration was found to be incorrect. The load tilted and nearly dropped. No lift plan had been prepared and the rigger was not qualified for heavy lifts.' },
  { site: 'Neelam & Heera', reportType: 'UA/UC', narrative: 'During welding on a structural platform, sparks fell to the deck below where oil-contaminated rags were stored. No fire watch was posted and the area below had not been inspected or cleared before hot work.' },
  { site: 'Mumbai High North', reportType: 'Near-miss', narrative: 'A maintenance technician entered a tank without a confined space permit. No atmospheric testing was done and no ventilation was set up. The technician was inside for 15 minutes before a supervisor noticed and stopped the work.' },
  { site: 'Bassein & Satellite', reportType: 'Incident', narrative: 'A pipe fell from a crane load during lifting operations, striking a worker on the hard hat. The pipe was not properly rigged and no tag line was used. The worker sustained a head injury but the hard hat prevented serious harm.' },
  { site: 'Mumbai High South', reportType: 'UA/UC', narrative: 'During isolation of an electrical motor for maintenance, the breaker was opened but not locked. A second technician closed the breaker thinking it had tripped. The motor started while the first technician was working on the coupling.' },
  { site: 'Heera Asset', reportType: 'Near-miss', narrative: 'A worker was climbing a process vessel ladder at 25 meters. The ladder safety system was not functional and the worker was not using a harness. A rung was found to be corroded during the climb.' },
  { site: 'Uran Plant', reportType: 'UA/UC', narrative: 'Hot work was in progress on a section of pipe that had not been isolated or purged. Gas testing was not performed. The welder noticed a smell of hydrocarbon but continued welding until a supervisor stopped the work.' },
  { site: 'South Tapti', reportType: 'Near-miss', narrative: 'A worker was observed between a reversing forklift and a storage rack. The forklift had no reverse alarm and no spotter was assigned. The worker was pulled to safety by a coworker at the last moment.' },
  { site: 'Mumbai High North', reportType: 'UA/UC', narrative: 'During scaffolding erection near the gas processing unit, workers were at height without harnesses. The scaffold was not tagged and no inspection had been done. Guardrails were not yet installed on the top platform.' },
  { site: 'Bassein & Satellite', reportType: 'Near-miss', narrative: 'During depressurization of a gas pipeline for maintenance, the vent valve leaked. The team had not verified the valve integrity before starting depressurization. Gas was released near the work area until the valve was tightened.' },
  { site: 'Neelam & Heera', reportType: 'UA/UC', narrative: 'A worker was grinding metal near a collection of flammable cleaning solvents. No gas testing or area inspection was done. No fire watch was assigned and no hot work permit was visible at the location.' },
  { site: 'Hazira Plant', reportType: 'Near-miss', narrative: 'During a heavy lift of a compressor module, the crane operator exceeded the load chart limits. The crane began to tip but was stabilized by quick action. No lift plan had been reviewed and the ground bearing capacity was not assessed.' },
  { site: 'Mumbai High South', reportType: 'UA/UC', narrative: 'Workers entered a pit for cable inspection without a confined space permit. The pit had poor ventilation and no atmospheric testing was done. No standby person was assigned and no rescue equipment was available.' },
  { site: 'Dadra Asset', reportType: 'Near-miss', narrative: 'During valve replacement on a crude line, the isolation was not verified at the worksite. The operator relied on the control room shut-in without local verification. When the valve was unbolted, oil spilled from the line under residual pressure.' },
  { site: 'Heera Asset', reportType: 'UA/UC', narrative: 'A scaffold was being used for painting at 15 meters. The guardrail was incomplete on one side and the platform had a gap in the decking. The painters were not using harnesses or lanyards.' },
  { site: 'Uran Plant', reportType: 'Near-miss', narrative: 'During welding of a pipe support, the area below contained temporary storage of wooden pallets and cardboard. No fire watch was posted and no gas testing was done. The materials were removed only after a passerby noticed the risk.' },
  { site: 'Bassein & Satellite', reportType: 'UA/UC', narrative: 'A crane was lifting a container over an active walkway. No exclusion zone was established and the path was not cleared. Workers continued to walk under the suspended load during the entire lifting operation.' },
  { site: 'Mumbai High North', reportType: 'Near-miss', narrative: 'A maintenance team was working on a gas cooler. The isolation valve was closed but not locked. The team did not verify zero energy. During the work, the valve was inadvertently opened by an operator checking line status, releasing gas into the work area.' },
  { site: 'South Tapti', reportType: 'UA/UC', narrative: 'A worker was inside a storage tank performing cleaning. No atmospheric monitoring was being conducted during the work. The ventilation fan had stopped and nobody noticed. The worker began feeling unwell before being pulled out.' },
];

export function generateSeedReports(): ReportInsert[] {
  const reports: ReportInsert[] = [];
  const now = new Date();

  SEED_TEMPLATES.forEach((template, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - Math.floor(Math.random() * 90) - 1);

    const analysis = analyzeReport(template.narrative);

    reports.push({
      report_id: `RPT-${String(index + 1).padStart(4, '0')}`,
      report_date: date.toISOString().split('T')[0],
      site: template.site,
      report_type: template.reportType,
      raw_narrative: template.narrative,
      activity: analysis.activity,
      sif_level: analysis.sifLevel,
      priority_score: analysis.priorityScore,
      life_saving_rule: analysis.lifeSavingRule,
      hazard: analysis.hazard,
      barrier: analysis.barrier,
      barrier_failure: analysis.barrierFailure,
      potential_consequence: analysis.potentialConsequence,
      explanation: analysis.explanation,
      evidence: analysis.evidence,
      recommended_action: analysis.recommendedAction,
      review_status: 'Pending',
      is_seed: true,
    });
  });

  return reports;
}

export const DEMO_REPORTS: { label: string; text: string }[] = [
  {
    label: 'Energy Isolation',
    text: 'During maintenance of a crude oil transfer line, the team isolated the section but did not verify zero pressure before loosening the flange. Trapped pressure was released when the flange was opened. Nobody was injured.',
  },
  {
    label: 'Working at Height',
    text: 'A scaffolding platform was being used for inspection work on the flare tower. One section of the guardrail was missing. No alternative fall protection was being used. The inspector was working at 15 meters elevation without a harness.',
  },
  {
    label: 'Hot Work',
    text: 'Welding was being performed near a process line containing hydrocarbon residue. Gas testing had not been completed before welding started. No fire watch was posted and the area was not cleared of combustible materials.',
  },
  {
    label: 'Confined Space',
    text: 'A worker entered a storage vessel for cleaning. A confined space entry permit had been issued but atmospheric testing was not performed. The worker entered the vessel before the job was stopped by a supervisor.',
  },
  {
    label: 'Low Risk',
    text: 'Several loose papers were found near the entrance of the control room. They were removed immediately. Minor housekeeping issue.',
  },
  {
    label: 'Successful Barrier',
    text: 'The electrical supply to the pump was isolated and locked out. The technician tested the equipment and confirmed zero energy before starting maintenance. All procedures were followed correctly.',
  },
];
