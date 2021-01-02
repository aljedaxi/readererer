import {
	useState,
} from 'react';
import {
	range, 
	div,
	map, 
	add,
	pipe,
	sub,
	I,
	any, fromMaybe,
	isNothing,
	parseFloat,
} from 'sanctuary';
import {
	formatWithOptions, getISODay, compareAsc, differenceInCalendarDays
} from 'date-fns/fp';
import {startOfToday} from 'date-fns';
import * as locales from 'date-fns/locale';
import {createUseStyles} from 'react-jss';

const getDaysInM = y => m => new Date(y,m,0).getDate();
const succ = add (1);
const trace = s => {console.log(s); return s;};

const CalBox = ({children, size = 150, style, ...rest}) => {
	return (
		<div {...rest} style={{width: size, height: size, ...style}}>
			{children}
		</div>
	);
};

const useDayStyles = createUseStyles({
	container: {
		'&:hover': {
			background: props => props.hoverColor,
		}
	},
});

const dater = y => m => d => new Date(y,m,d);
const Calendar = props => {
	const {
		month,
		year,
		localeString = 'enCA',
		onDayHoverColor,
		onDayClicked,
		Day,
	} = props;
	const d = dater (year) (month);
	const daysInM = range (0) (getDaysInM (year) (month));
	const days = map (n => ({ 
		n: succ (n), onClick: onDayClicked, hoverColor: onDayHoverColor, month, year,
	})) (daysInM);
	const emptyDays = sub (getISODay (d (days[0].n))) (6);
	const locale = locales[localeString];
	const monthName = formatWithOptions ({locale}) ('MMMM') (new Date(year, month, 1));
	const formatDayOfWeek = formatWithOptions ({locale}) ('iiii');
	const nToDayOfWeek = pipe([ d, formatDayOfWeek ]);
	const row = {display: 'flex', flexWrap: 'wrap', flexDirection: 'row'};
	const daysOfWeek = map (nToDayOfWeek) (range (0) (7));
	const size = 150;
	return (
		<div style={{width: size * 7}}>
			<h2>
				{monthName}
			</h2>
			<div style={row}>
				{
					map (s => (
						<div style={{width: size}}>
							<h3>
								{s}
							</h3>
						</div>
					)) (daysOfWeek)
				}
			</div>
			<hr />
			<div style={row}>
				{
					map (CalBox) (range (0) (emptyDays))
				}
				{
					map (Day) (days)
				}
			</div>
		</div>
	);
};

const setter = s => e => s(e.target.value);
const Menu = props => {
	const {
		onDone
	} = props;
	const [pages, setPages] = useState('');
	const [rate, setRate] = useState('');
	const handleSubmit = e => {
		e.preventDefault();
		const hopefullyBoth = map (parseFloat) ({pages, rate});
		if (any (isNothing) (hopefullyBoth)) {
			alert('a horse walks into a cafe and asks for coffee with no milk. the barista says "we don\'t have coffee with no milk, but i can give you coffee with no cream".');
			return;
		}
		onDone(map (fromMaybe (0)) (hopefullyBoth));
	};
	const row = {width: '100%'};
	return (
		<form onSubmit={handleSubmit}>
			<div style={row}>
				<label htmlFor="pages">how many pages of actual content?</label>
				<input id='pages' name='pages' type='number' onChange={setter(setPages)} value={pages} />
			</div>
			<div style={row}>
				<label htmlFor="rate">how many pages can you read in an hour?</label>
				<input id='rate' name='rate' type='number' onChange={setter(setRate)} value={rate} />
			</div>
			<div style={row}>
				<input type="submit" />
			</div>
		</form>
	);
};

const steps = [Menu, Calendar];
const calcHoursPerDay = hours => days => {
	if (days <= 1) return hours;
	if (hours <= 0 || days <= 0) return 0;
	return hours / days;
};

const App = () => {
	const [step, setStep] = useState(0);
	const [pages, setPages] = useState(0);
	const [pagesPerHour, setPagesPerHour] = useState(0);
	const [day, setDay] = useState();

	const today = startOfToday();
	const month = 0;
	const year = 2021;
	const hoverColor = 'yellow';

	const hours = pages / pagesPerHour;
	const daysTilDue = differenceInCalendarDays (today) (day);
	const hourPerDay = calcHoursPerDay (hours) (daysTilDue);
	const showHours = n => {
		if (!day || compareAsc (today) (day) < 1) return false;
		const thisDay = new Date(year, month, n);
		const c2this = compareAsc (thisDay);
		return (c2this (day) === 1 && c2this (today) < 1)
			|| c2this (today) === 0;
	};

	const title = step === 0 ? 'tell me about yourself' : 'when\'s your thing?';
	const mainProps = {
		pages, pagesPerHour, day, month, year,
		onDone: ({pages, rate}) => {
			setPages(pages);
			setPagesPerHour(rate);
			setStep(add(1));
		},
		onDayClicked: n => setDay(new Date(year, month, n)),
		Day: props => {
			const {
				n, month, year,
				onClick,
			} = props;
			const selected = compareAsc (new Date(year, month, n)) (day) === 0;
			const text = showHours (n) ? hourPerDay.toFixed(1) : '';
			const {container} = useDayStyles({hoverColor});
			const style = {
				color: selected ? 'red' : undefined,
				borderRight: 'black',
			};
			const handleClick = _ => (onClick ?? I)(n);
			return (
				<CalBox style={style} className={container} onClick={handleClick} key={n}>
					<h4>
						{n}
						<br />
						<br />
						{text}
					</h4>
				</CalBox>
			);
		},
	};
	const Main = steps[step];
  return (
		<div>
			<h1>{title}</h1>
			<Main {...mainProps} />
		</div>
  );
}

export default App;
