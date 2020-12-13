import { Action, Dispatch } from 'redux';
import { ShlinkVisitsOverview } from '../../utils/services/types';
import { ShlinkApiClientBuilder } from '../../utils/services/ShlinkApiClientBuilder';
import { GetState } from '../../container/types';
import { buildReducer } from '../../utils/helpers/redux';
import { CREATE_VISITS, CreateVisitsAction } from './visitCreation';

/* eslint-disable padding-line-between-statements */
export const GET_OVERVIEW_START = 'shlink/visitsOverview/GET_OVERVIEW_START';
export const GET_OVERVIEW_ERROR = 'shlink/visitsOverview/GET_OVERVIEW_ERROR';
export const GET_OVERVIEW = 'shlink/visitsOverview/GET_OVERVIEW';
/* eslint-enable padding-line-between-statements */

export interface VisitsOverview {
  visitsCount: number;
  loading: boolean;
  error: boolean;
}

export type GetVisitsOverviewAction = ShlinkVisitsOverview & Action<string>;

const initialState: VisitsOverview = {
  visitsCount: 0,
  loading: false,
  error: false,
};

export default buildReducer<VisitsOverview, GetVisitsOverviewAction & CreateVisitsAction>({
  [GET_OVERVIEW_START]: () => ({ ...initialState, loading: true }),
  [GET_OVERVIEW_ERROR]: () => ({ ...initialState, error: true }),
  [GET_OVERVIEW]: (_, { visitsCount }) => ({ ...initialState, visitsCount }),
  [CREATE_VISITS]: ({ visitsCount, ...rest }, { createdVisits }) => ({
    ...rest,
    visitsCount: visitsCount + createdVisits.length,
  }),
}, initialState);

export const loadVisitsOverview = (buildShlinkApiClient: ShlinkApiClientBuilder) => () => async (
  dispatch: Dispatch,
  getState: GetState,
) => {
  dispatch({ type: GET_OVERVIEW_START });

  try {
    const { getVisitsOverview } = buildShlinkApiClient(getState);
    const result = await getVisitsOverview();

    dispatch({ type: GET_OVERVIEW, ...result });
  } catch (e) {
    dispatch({ type: GET_OVERVIEW_ERROR });
  }
};