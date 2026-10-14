import { FormattedText } from 'drupal-canvas';

const mediaCell =
  'min-h-36 overflow-hidden rounded-3xl [&_img]:!m-0 [&_img]:!h-full [&_img]:!w-full [&_img]:!max-w-none [&_img]:!object-cover';

const defaultHeadingLight = '<p>PEPSICO</p>';
const defaultHeadingDark = '<p>FÜR IHRE</p><p>GASTRONOMIE</p>';
const defaultText =
  '<p>PepsiCo überzeugt mit starken Marken und attraktiver Produktvielfalt, die weltweit begeistern. Unser Sortiment an Erfrischungsgetränken, individueller Kundenbetreuung und Professionalität machen PepsiCo zu Ihrem zuverlässigen Partner im Außer-Haus-Markt.</p>';

function htmlValue(value) {
  if (typeof value === 'string') {
    return value;
  }
  if (value && typeof value.value === 'string') {
    return value.value;
  }
  return '';
}

function hasText(value) {
  return htmlValue(value)
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim().length > 0;
}

const PepsicoHero = ({
  left,
  right,
  wide,
  actions,
  headingLight = defaultHeadingLight,
  headingDark = defaultHeadingDark,
  text = defaultText,
}) => {
  const light = hasText(headingLight) ? htmlValue(headingLight) : '';
  const dark = hasText(headingDark) ? htmlValue(headingDark) : '';
  const body = hasText(text) ? htmlValue(text) : '';

  return (
    <section className="mx-auto grid w-full max-w-7xl items-stretch gap-4 lg:grid-cols-2">
      <div className="grid min-w-0 grid-cols-2 gap-3">
        <div className={`${mediaCell} aspect-[4/3] min-w-0`}>{left}</div>
        <div className={`${mediaCell} aspect-[4/3] min-w-0`}>{right}</div>
        <div className={`${mediaCell} col-span-2 aspect-[2/1] min-w-0`}>
          {wide}
        </div>
      </div>
      <div className="flex flex-col justify-center rounded-3xl bg-[#3680CE] px-8 py-10 text-white sm:px-10">
        {light ? (
          <FormattedText className="text-[2.5rem] leading-none font-bold tracking-wide text-[#CDE9FF] uppercase [&_p]:m-0">
            {light}
          </FormattedText>
        ) : null}
        {dark ? (
          <FormattedText className="text-[2.5rem] leading-none font-bold tracking-wide text-[#02355A] uppercase [&_p]:m-0">
            {dark}
          </FormattedText>
        ) : null}
        {body ? (
          <FormattedText className="mt-6 max-w-xl text-sm leading-6 text-white/90 [&_p]:m-0">
            {body}
          </FormattedText>
        ) : null}
        <div className="mt-8 flex min-h-12 flex-wrap gap-3">{actions}</div>
      </div>
    </section>
  );
};

export default PepsicoHero;
