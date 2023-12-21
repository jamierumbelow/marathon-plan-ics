import dayjs from "dayjs";

const usage =
  "Usage: bun run index.ts [MARATHON DATE: YYYY-MM-DD] [GOAL TIME: HH:MM:SS]";

// Parse the date

const marathonDate = process.argv[2];
const parsedDate = dayjs(marathonDate, "YYYY-MM-DD");
if (!marathonDate || !parsedDate.isValid()) {
  console.error(usage);
  process.exit(1);
}

// Parse the goal time

const parseTime = (time: string): number => {
  const [hours, minutes, seconds] = time.split(":");
  return parseInt(hours) * 3600 + parseInt(minutes) / 60 + parseInt(seconds);
};

const goalTime = process.argv[3];
const parsedGoalTimeSeconds = parseTime(goalTime);
if (!goalTime || !parsedGoalTimeSeconds) {
  console.error(usage);
  process.exit(1);
}

// Let's set up some useful constants and helper functions

const startTime = "07:00:00";
const parsedGoalPaceSecondsPerMile = parsedGoalTimeSeconds / 26.2;
const easyRunMultiplier = 1.5;

type Run = {
  date: string;
  distanceMiles: number;
  paceSeconds: number;
};

const calculatePace = (distanceMiles: number): number =>
  distanceMiles * parsedGoalPaceSecondsPerMile;

const displayPace = (paceSeconds: number): string => {
  if (paceSeconds > 3600) {
    return `${Math.floor(paceSeconds / 3600)}h ${Math.floor(
      (paceSeconds % 3600) / 60
    )}m ${paceSeconds % 60}s`;
  }

  return `${Math.floor(paceSeconds / 60)}m ${paceSeconds % 60}s`;
};

const run = (
  distanceMiles: number,
  paceSeconds: number
): Omit<Run, "date"> => ({
  distanceMiles,
  paceSeconds,
});

// We'll generate a list of dates, starting from the marathon
// date and going back to today.
//
// The plan is based on Hal Higdon's Novice 2 marathon training plan:
// https://www.halhigdon.com/training-programs/marathon-training/novice-2-marathon/
//
// Week	Mon	Tue	Wed	Thu	Fri	Sat	Sun
// 1	Rest	3 mi run	5 m pace	3 mi run	Rest	8	Cross
// 2	Rest	3 mi run	5 mi run	3 mi run	Rest	9	Cross
// 3	Rest	3 mi run	5 m pace	3 mi run	Rest	6	Cross
// 4	Rest	3 mi run	6 m pace	3 mi run	Rest	11	Cross
// 5	Rest	3 mi run	6 mi run	3 mi run	Rest	12	Cross
// 6	Rest	3 mi run	6 m pace	3 mi run	Rest	9	Cross
// 7	Rest	4 mi run	7 m pace	4 mi run	Rest	14	Cross
// 8	Rest	4 mi run	7 mi run	4 mi run	Rest	15	Cross
// 9	Rest	4 mi run	7 m pace	4 mi run	Rest	Rest	Half Marathon
// 10	Rest	4 mi run	8 m pace	4 mi run	Rest	17	Cross
// 11	Rest	5 mi run	8 mi run	5 mi run	Rest	18	Cross
// 12	Rest	5 mi run	8 m pace	5 mi run	Rest	13	Cross
// 13	Rest	5 mi run	5 m pace	5 mi run	Rest	19	Cross
// 14	Rest	5 mi run	8 mi run	5 mi run	Rest	12	Cross
// 15	Rest	5 mi run	5 m pace	5 mi run	Rest	20	Cross
// 16	Rest	5 mi run	4 m pace	5 mi run	Rest	12	Cross
// 17	Rest	4 mi run	3 mi run	4 mi run	Rest	8	Cross
// 18	Rest	3 mi run	2 mi run	Rest	Rest	2 mi run	Marathon

const tempoRun = (distanceMiles: number): Omit<Run, "date"> => ({
  distanceMiles,
  paceSeconds: calculatePace(distanceMiles),
});

const easyRun = (distanceMiles: number): Omit<Run, "date"> => ({
  distanceMiles,
  paceSeconds: calculatePace(distanceMiles) * easyRunMultiplier,
});

const halHigdonPlanMiles = [
  [null, easyRun(3), tempoRun(5), easyRun(3), null, easyRun(8), null],
  [null, easyRun(3), easyRun(5), easyRun(3), null, easyRun(9), null],
  [null, easyRun(3), tempoRun(5), easyRun(3), null, easyRun(6), null],
  [null, easyRun(3), tempoRun(6), easyRun(3), null, easyRun(11), null],
  [null, easyRun(3), easyRun(6), easyRun(3), null, easyRun(12), null],
  [null, easyRun(3), tempoRun(6), easyRun(3), null, easyRun(9), null],
  [null, easyRun(4), tempoRun(7), easyRun(4), null, easyRun(14), null],
  [null, easyRun(4), easyRun(7), easyRun(4), null, easyRun(15), null],
  [null, easyRun(4), tempoRun(7), easyRun(4), null, null, tempoRun(13.1)],
  [null, easyRun(4), tempoRun(8), easyRun(4), null, easyRun(17), null],
  [null, easyRun(5), easyRun(8), easyRun(5), null, easyRun(18), null],
  [null, easyRun(5), tempoRun(8), easyRun(5), null, easyRun(13), null],
  [null, easyRun(5), tempoRun(5), easyRun(5), null, easyRun(19), null],
  [null, easyRun(5), easyRun(8), easyRun(5), null, tempoRun(12), null],
  [null, easyRun(5), tempoRun(5), easyRun(5), null, easyRun(20), null],
  [null, easyRun(5), tempoRun(4), easyRun(5), null, tempoRun(12), null],
  [null, easyRun(4), easyRun(3), easyRun(4), null, easyRun(8), null],
  [null, easyRun(3), easyRun(2), null, null, easyRun(2), tempoRun(26.2)],
];

// If we're more than 18 weeks out, we'll just repeat the first week
// until we get to 18 weeks out.
//
// We'll also ignore the cross training days since this is for me and I've
// already got tennis and gym stuff.

// Count the number of weeks until the marathon
const today = dayjs();
const weeksUntilMarathon = parsedDate.diff(today, "week");

// The plan is 18 weeks long, so we'll repeat the first week
// until we get to 18 weeks out.
const weeksUntilMarathonMod18 = weeksUntilMarathon % 18;

// Generate the plan by looping through the weeks until the marathon
// and indexing into the plan.

const plan: (Run | null)[] = [];

for (let i = 0; i < weeksUntilMarathon; i++) {
  for (let j = 0; j < 7; j++) {
    const weekIndex =
      i <= weeksUntilMarathonMod18 ? 0 : i - weeksUntilMarathonMod18;

    const runObj = halHigdonPlanMiles[weekIndex][j];

    if (runObj) {
      plan.push({
        date: today.add(i, "week").add(j, "day").format("YYYY-MM-DD"),
        ...runObj,
      });
    } else {
      plan.push(null);
    }
  }
}

console.log(plan);
