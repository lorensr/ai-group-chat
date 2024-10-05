import { gql } from '@apollo/client'

export const REPORT_USER_ACTIVITY = gql`
  mutation ReportUserActivity {
    reportUserActivity {
      id
    }
  }
`
