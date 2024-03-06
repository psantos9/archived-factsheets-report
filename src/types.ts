export interface IUser {
  id: string
  displayName: string
  email: string
}

export interface IFactSheetArchivedEvent {
  id: string
  createdAt: Date
  user: IUser
  comment: string
}

export interface IRow {
  factSheetId: string
  factSheetType: string
  factSheetName: string
  userId: string | null
  userName: string | null
  userEmail: string | null
  archivedAt: string | null
  comment: string | null
}
