import { isEmpty, pipe, replace, trim } from 'ramda';
import { FC, useMemo, useState } from 'react';
import { Button, FormGroup, Input } from 'reactstrap';
import { InputType } from 'reactstrap/lib/Input';
import * as m from 'moment';
import DateInput, { DateInputProps } from '../utils/DateInput';
import Checkbox from '../utils/Checkbox';
import { Versions } from '../utils/helpers/version';
import { supportsListingDomains, supportsSettingShortCodeLength } from '../utils/helpers/features';
import { handleEventPreventingDefault, hasValue } from '../utils/utils';
import { SelectedServer } from '../servers/data';
import { formatIsoDate } from '../utils/helpers/date';
import { TagsSelectorProps } from '../tags/helpers/TagsSelector';
import { DomainSelectorProps } from '../domains/DomainSelector';
import { SimpleCard } from '../utils/SimpleCard';
import { Settings, ShortUrlCreationSettings } from '../settings/reducers/settings';
import { ShortUrlData } from './data';
import { ShortUrlCreation } from './reducers/shortUrlCreation';
import UseExistingIfFoundInfoIcon from './UseExistingIfFoundInfoIcon';
import { CreateShortUrlResultProps } from './helpers/CreateShortUrlResult';
import './CreateShortUrl.scss';

export interface CreateShortUrlProps {
  basicMode?: boolean;
}

interface CreateShortUrlConnectProps extends CreateShortUrlProps {
  settings: Settings;
  shortUrlCreationResult: ShortUrlCreation;
  selectedServer: SelectedServer;
  createShortUrl: (data: ShortUrlData) => Promise<void>;
  resetCreateShortUrl: () => void;
}

export const normalizeTag = pipe(trim, replace(/ /g, '-'));

const getInitialState = (settings?: ShortUrlCreationSettings): ShortUrlData => ({
  longUrl: '',
  tags: [],
  customSlug: '',
  shortCodeLength: undefined,
  domain: '',
  validSince: undefined,
  validUntil: undefined,
  maxVisits: undefined,
  findIfExists: false,
  validateUrl: settings?.validateUrls ?? false,
});

type NonDateFields = 'longUrl' | 'customSlug' | 'shortCodeLength' | 'domain' | 'maxVisits';
type DateFields = 'validSince' | 'validUntil';

const CreateShortUrl = (
  TagsSelector: FC<TagsSelectorProps>,
  CreateShortUrlResult: FC<CreateShortUrlResultProps>,
  ForServerVersion: FC<Versions>,
  DomainSelector: FC<DomainSelectorProps>,
) => ({
  createShortUrl,
  shortUrlCreationResult,
  resetCreateShortUrl,
  selectedServer,
  basicMode = false,
  settings: { shortUrlCreation: shortUrlCreationSettings },
}: CreateShortUrlConnectProps) => {
  const initialState = useMemo(() => getInitialState(shortUrlCreationSettings), [ shortUrlCreationSettings ]);
  const [ shortUrlCreation, setShortUrlCreation ] = useState(initialState);
  const changeTags = (tags: string[]) => setShortUrlCreation({ ...shortUrlCreation, tags: tags.map(normalizeTag) });
  const reset = () => setShortUrlCreation(initialState);
  const save = handleEventPreventingDefault(() => {
    const shortUrlData = {
      ...shortUrlCreation,
      validSince: formatIsoDate(shortUrlCreation.validSince) ?? undefined,
      validUntil: formatIsoDate(shortUrlCreation.validUntil) ?? undefined,
    };

    createShortUrl(shortUrlData).then(reset).catch(() => {});
  });
  const renderOptionalInput = (id: NonDateFields, placeholder: string, type: InputType = 'text', props = {}) => (
    <FormGroup>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={shortUrlCreation[id]}
        onChange={(e) => setShortUrlCreation({ ...shortUrlCreation, [id]: e.target.value })}
        {...props}
      />
    </FormGroup>
  );
  const renderDateInput = (id: DateFields, placeholder: string, props: Partial<DateInputProps> = {}) => (
    <div className="form-group">
      <DateInput
        selected={shortUrlCreation[id] as m.Moment | null}
        placeholderText={placeholder}
        isClearable
        onChange={(date) => setShortUrlCreation({ ...shortUrlCreation, [id]: date })}
        {...props}
      />
    </div>
  );
  const basicComponents = (
    <>
      <FormGroup>
        <Input
          bsSize="lg"
          type="url"
          placeholder="URL to be shortened"
          required
          value={shortUrlCreation.longUrl}
          onChange={(e) => setShortUrlCreation({ ...shortUrlCreation, longUrl: e.target.value })}
        />
      </FormGroup>

      <FormGroup>
        <TagsSelector tags={shortUrlCreation.tags ?? []} onChange={changeTags} />
      </FormGroup>
    </>
  );

  const showDomainSelector = supportsListingDomains(selectedServer);
  const disableShortCodeLength = !supportsSettingShortCodeLength(selectedServer);

  return (
    <form className="create-short-url" onSubmit={save}>
      {basicMode && basicComponents}
      {!basicMode && (
        <>
          <SimpleCard title="Basic options" className="mb-3">
            {basicComponents}
          </SimpleCard>

          <div className="row">
            <div className="col-sm-6 mb-3">
              <SimpleCard title="Customize the short URL">
                {renderOptionalInput('customSlug', 'Custom slug', 'text', {
                  disabled: hasValue(shortUrlCreation.shortCodeLength),
                })}
                {renderOptionalInput('shortCodeLength', 'Short code length', 'number', {
                  min: 4,
                  disabled: disableShortCodeLength || hasValue(shortUrlCreation.customSlug),
                  ...disableShortCodeLength && {
                    title: 'Shlink 2.1.0 or higher is required to be able to provide the short code length',
                  },
                })}
                {!showDomainSelector && renderOptionalInput('domain', 'Domain', 'text')}
                {showDomainSelector && (
                  <FormGroup>
                    <DomainSelector
                      value={shortUrlCreation.domain}
                      onChange={(domain?: string) => setShortUrlCreation({ ...shortUrlCreation, domain })}
                    />
                  </FormGroup>
                )}
              </SimpleCard>
            </div>

            <div className="col-sm-6 mb-3">
              <SimpleCard title="Limit access to the short URL">
                {renderOptionalInput('maxVisits', 'Maximum number of visits allowed', 'number', { min: 1 })}
                {renderDateInput('validSince', 'Enabled since...', { maxDate: shortUrlCreation.validUntil as m.Moment | undefined })}
                {renderDateInput('validUntil', 'Enabled until...', { minDate: shortUrlCreation.validSince as m.Moment | undefined })}
              </SimpleCard>
            </div>
          </div>

          <SimpleCard title="Extra validations" className="mb-3">
            <p>
              Make sure the long URL is valid, or ensure an existing short URL is returned if it matches all
              provided data.
            </p>
            <ForServerVersion minVersion="2.4.0">
              <p>
                <Checkbox
                  inline
                  checked={shortUrlCreation.validateUrl}
                  onChange={(validateUrl) => setShortUrlCreation({ ...shortUrlCreation, validateUrl })}
                >
                  Validate URL
                </Checkbox>
              </p>
            </ForServerVersion>
            <p>
              <Checkbox
                inline
                className="mr-2"
                checked={shortUrlCreation.findIfExists}
                onChange={(findIfExists) => setShortUrlCreation({ ...shortUrlCreation, findIfExists })}
              >
                Use existing URL if found
              </Checkbox>
              <UseExistingIfFoundInfoIcon />
            </p>
          </SimpleCard>
        </>
      )}

      <div className="text-center">
        <Button
          outline
          color="primary"
          disabled={shortUrlCreationResult.saving || isEmpty(shortUrlCreation.longUrl)}
          className="btn-xs-block"
        >
          {shortUrlCreationResult.saving ? 'Creating...' : 'Create'}
        </Button>
      </div>

      <CreateShortUrlResult
        {...shortUrlCreationResult}
        resetCreateShortUrl={resetCreateShortUrl}
        canBeClosed={basicMode}
      />
    </form>
  );
};

export default CreateShortUrl;
