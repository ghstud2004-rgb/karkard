
export enum PersonnelStatus {
  PRESENT = 'حاضر',
  LEAVE = 'مرخصی',
  SICK_LEAVE = 'استعلاجی'
}

export interface WorkLog {
  id: string;
  productDescription: string;
  startTime: string;
  endTime: string;
}

export interface PersonnelRecord {
  id: string;
  operatorCode: string;
  fullName: string;
  machineCode: string;
  status: PersonnelStatus;
  entryTime: string;
  exitTime: string;
  totalPresence: string;
  workLogs: WorkLog[];
  createdAt: number;
}
