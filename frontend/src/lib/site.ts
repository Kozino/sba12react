export const SITE = {
  name: "Savio Bosco Alphas 2012",
  shortName: "SBA 2012",
  motto: "Ecce quam bonum et quam iucundum habitare fratres in unum",
  mottoTranslation:
    "Behold, how good and pleasant it is when brothers dwell in unity",
  mottoRef: "Psalm 133:1",
  tagline: "One seminary family, one brotherhood for life.",
  email: "info@savioboscoalphas.org",
  phone: "+234 803 000 0000",
  address:
    "St. Dominic Savio Seminary, Akpu, Orumba South LGA, Anambra State, Nigeria"
};

export const PAYMENT_TYPES = [
  {
    key: "annual_due",
    label: "Annual Due",
    description:
      "The yearly membership due every member pays to the association (Constitution, Part Two §2)."
  },
  {
    key: "financial_presence",
    label: "Financial Presence",
    description:
      "Appearance fee paid at the Annual General Meeting (Constitution, Part Two §2.v)."
  },
  {
    key: "burial_contribution",
    label: "Burial Contribution",
    description:
      "Bereavement support for members and their immediate families (Constitution, Part Two §3–4)."
  },
  {
    key: "wedding_contribution",
    label: "Wedding Contribution",
    description:
      "Support for the marriage of financially up-to-date members (Constitution, Part Two §3.iv)."
  }
] as const;

export type PaymentKey = (typeof PAYMENT_TYPES)[number]["key"];

export function payLabel(key: string): string {
  return PAYMENT_TYPES.find((p) => p.key === key)?.label ?? key;
}

export const DOC_TYPES = [
  { key: "financial_report", label: "Financial Report" },
  { key: "minutes", label: "Minutes of Meeting" },
  { key: "attendance", label: "Attendance Record" },
  { key: "financial_presence", label: "Financial Presence" },
  { key: "constitution", label: "Constitution" }
] as const;

export type DocKey = (typeof DOC_TYPES)[number]["key"];

export function docLabel(key: string): string {
  return DOC_TYPES.find((d) => d.key === key)?.label ?? key;
}

export const EXECUTIVES = [
  {
    name: "President",
    short: "Leads the association and presides over all meetings.",
    duties: [
      "Functions as the leader of the association and head of the management committee",
      "Presides over the Annual General Meeting and all other activities of the association",
      "Arranges all meetings and sets up sub-committees and panels",
      "Is a signatory to the association's bank account",
      "Has the final say in matters of contention and represents the association officially"
    ]
  },
  {
    name: "Vice President",
    short: "Acts in place of the President in his absence.",
    duties: [
      "Acts in the place of the President in the absence or incapacity of the President",
      "Works together with the President and the other executives",
      "Gathers current data (addresses, phone numbers) of the executives annually and distributes it",
      "In conjunction with the organizers, arranges the meeting place"
    ]
  },
  {
    name: "Secretary",
    short: "Custodian of the records and minutes of all meetings.",
    duties: [
      "Custodian of the records: minutes of all Executive Committee and Annual General Meetings, and of all standing and special committees",
      "Records the minutes of all general and executive meetings",
      "Gives notice of meetings and circulates facts and minutes of all proceedings",
      "Responsible for corresponding with individuals and organizations"
    ]
  },
  {
    name: "Assistant Secretary",
    short: "Keeps the roll of members present at meetings.",
    duties: [
      "Keeps the roll of members present at meetings and calls the roll when required",
      "Stands in for the Secretary when absent or incapacitated"
    ]
  },
  {
    name: "Financial Secretary",
    short: "Keeps the records of all financial transactions.",
    duties: [
      "Keeps accurate record of all financial transactions of the association",
      "Receives funds and issues receipts of membership fees to members",
      "Submits a financial report at each Annual General Meeting",
      "Is a signatory to the bank account; drafts the budget with the President and Treasurer"
    ]
  },
  {
    name: "Treasurer",
    short: "Keeps the cash assets and makes approved expenses.",
    duties: [
      "Keeps all cash assets of the association and makes expenses on its behalf",
      "Keeps accurate record of the financial transactions",
      "Liaises with the Financial Secretary and President in drafting the budget",
      "Is a signatory to the bank account and approves the financial report before it is read at each AGM"
    ]
  },
  {
    name: "Provost",
    short: "Maintains decorum at the meeting place.",
    duties: [
      "Maintains decorum in the meeting place",
      "Penalizes offenders and collects their fines accordingly",
      "Is the returning officer on any in-house voting"
    ]
  },
  {
    name: "Public Relations Officer",
    short: "Liaison between the association, agencies and the media.",
    duties: [
      "In charge of circulation of memo and notices within the association",
      "Is the liaison between the association, relevant agencies and the news media"
    ]
  }
] as const;
