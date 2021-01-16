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
	complement,
	I,
	any, 
	parseFloat,
	maybeToNullable,
	filter,
	elem,
	append,
	compose,
} from 'sanctuary';
import {
	formatWithOptions, getISODay, compareAsc, differenceInCalendarDays,
	parseISO, eachMonthOfInterval, getMonth, getYear,
} from 'date-fns/fp';
import {startOfToday} from 'date-fns';
import * as locales from 'date-fns/locale';
import {createUseStyles} from 'react-jss';

const getDaysInM = y => m => new Date(y,m,0).getDate();
const succ = add (1);
const setter = s => e => s(e.target.value);
const dater = y => m => d => new Date(y,m,d);
const datesEq = d => e => compareAsc (d) (e) === 0;
const isLaterThan = d => e => compareAsc (d) (e) === -1;
const isLaterThanOrEqualTo = d => e => compareAsc (d) (e) < 1;
const isEarlierThan = d => e => compareAsc (d) (e) === -1;
const eq = x => y => x === y;

const CalBox = ({children, size = 150, style, ...rest}) => {
	return (
		<div {...rest} style={{width: size, height: size, ...style}}>
			{children}
		</div>
	);
};

const Calendar = props => {
	const {
		month,
		year,
		localeString = 'enCA',
		Day,
		landscape: isLegitLandscape, size,
	} = props;
	const calWidth = size * 7;
	const landscape = isLegitLandscape || window.innerWidth < calWidth;
	const d = dater (year) (month);
	const daysInM = range (0) (getDaysInM (year) (month));
	const emptyDays = range (0) (sub (getISODay (d (daysInM[0]))) (6));
	const locale = locales[localeString];
	const dowFormat = landscape ? 'iiii' : 'iiiii';

	const monthName = formatWithOptions ({locale}) ('MMMM') (new Date(year, month, 1));
	const formatDayOfWeek = formatWithOptions ({locale}) (dowFormat);

	const nToDayOfWeek = pipe([ d, formatDayOfWeek ]);
	const row = {display: 'flex', flexWrap: 'wrap', flexDirection: 'row'};
	const daysOfWeek = map (nToDayOfWeek) (range (0) (7));
	return (
		<div style={{width: calWidth}}>
			<h2>
				{monthName}
			</h2>
			<div style={row}>
				{
					map (s => (
						<div key={`s${s}m${month}y${year}`} style={{width: size}}>
							<h3 style={{paddingLeft: 5}}>
								{s}
							</h3>
						</div>
					)) (daysOfWeek)
				}
			</div>
			<hr />
			<div style={row}>
				{
					map (n => <CalBox key={`d${n}m${month}y${year}`} size={size}/>) (emptyDays)
				}
				{
					map (n => (
						<Day {...{n: succ (n), month, year, key: `d${n}m${month}y${year}`}}/>
					)) (daysInM)
				}
			</div>
		</div>
	);
};

const Input = ({style, noSecondSpace, ...rest}) => 
	<span>
		&nbsp;
		<input style={Object.assign({}, {width: '3em', border: 'none', borderBottom: '1px solid black'}, style)} {...rest}/>
		{noSecondSpace ? null : '\u00A0'}
	</span>
const isInvalid = n => n < 1;
const Menu = props => {
	const {
		onDone, pages, setPages, rate, setRate, 
		nameOfThing, setNameOfThing,
		today,
	} = props;
	const [dayString, setDayString] = useState('');
	const handleSubmit = e => {
		e.preventDefault();
		const parsedDate = parseISO (dayString);
		if (isLaterThan (today) (parsedDate)) {
			alert (`i'm afraid you've missed your ${nameOfThing}. is there anothing coming up?`);
		}
		if (!pages || !rate || !nameOfThing) {
			alert('a horse walks into a cafe and asks for coffee with no milk. the barista says "we don\'t have coffee with no milk, but i can give you coffee with no cream".');
			return;
		}
		const hopefullyBoth = map (pipe([parseFloat, maybeToNullable])) ({pages: pages.toString(), rate: rate.toString()});
		if (any (isInvalid) (hopefullyBoth)) {
			alert('a horse walks into a cafe and asks for coffee with no milk. the barista says "we don\'t have coffee with no milk, but i can give you coffee with no cream".');
			return;
		}
		onDone ({...hopefullyBoth, nameOfThing, parsedDate});
	};
	const row = {width: '100%'};
	return (
		<form onSubmit={handleSubmit}>
			<div style={row}>
				i have to read
				<Input id='pages' name='pages' type='number' onChange={setter(setPages)} value={pages} />
				pages of actual content, at
				<Input id='rate' name='rate' type='number' onChange={setter(setRate)} value={rate} 
					title='60 is about average, but it varies wildly based on the content, writing style, and typesetting'
				/>
				pages per hour,
			</div>
			<div style={row}>
				for my upcoming
				<Input 
					style={{width: '7em'}} 
					id='nameOfThing' 
					name='nameOfThing' 
					type='text' 
					onChange={setter(setNameOfThing)} 
					value={nameOfThing} 
				/>
				on,
				<Input 
					style={{width: '7.5em'}} 
					noSecondSpace
					id='eDay' 
					name='eDay' 
					type='date' 
					onChange={setter(setDayString)} 
					value={dayString} 
				/>
				.
			</div>
			<div style={{...row, padding: 5}}>
				<input style={{border: '1px solid black', background: 'transparent'}} type="submit" />
			</div>
		</form>
	);
};

const isntInRange = ({clickedDay, eDay, today}) =>
	isLaterThanOrEqualTo (clickedDay) (eDay) ||
	isEarlierThan (today) (clickedDay)

const onDayBad = ({setDaysOff, eDay, daysOff, year, month, today}) => n => {
	const clickedDay = new Date(year, month, n)
	if (isntInRange({clickedDay, eDay, today})) return;
	elem (clickedDay) (daysOff) 
		? setDaysOff(filter(complement (datesEq (clickedDay))))
		: setDaysOff(append(clickedDay));
};

const formatMinutes = uglyM => {
	const m = Math.round(uglyM);
	const hours = m >= 60 ? Math.floor(m / 60) : 0;
	const minutes = m % 60;
	return hours && minutes ? `${hours}h${minutes}m` 
		: hours ? `${hours}h`
		: `${minutes}m`;
};
const c = minutes => days => {
	if (days <= 1) return minutes;
	if (minutes <= 0 || days <= 0) return 0;
	return minutes / days;
};
const calcTimePerDay = m => compose (formatMinutes) (c (m));

const App = () => {
	const landscape = window.innerHeight < window.innerWidth;
	const today = startOfToday();
	// const hoverColor = '#ffff0099';
	const size = landscape ? 150 : 50;

	const [step, setStep] = useState(0);
	const incStep = _ => setStep(succ);
	const [pages, setPages] = useState(0);
	const [rate, setRate] = useState(60);
	const perMinute = rate / 60;
	const [nameOfThing, setNameOfThing] = useState('Seminar');
	const [eDay, setEDay] = useState(today);
	const [daysOff, setDaysOff] = useState([]);

	const minutes = pages / perMinute;
	const daysTilDue = differenceInCalendarDays (today) (eDay) - daysOff.length;
	const timePerDay = calcTimePerDay (minutes) (daysTilDue);

	const dayCalcs = calDay => {
		const sameDay = eq (0);
		const c2this = compareAsc (calDay);
		const thisAnd = c2this;
		const sameAsThis = d => sameDay (c2this (d));
		const isOff = any (sameAsThis) (daysOff);
		const selected = sameAsThis (eDay);
		const showHours = 
			eDay && 
			!isOff &&
			!isLaterThanOrEqualTo (today) (eDay) && (
			(c2this (eDay) === 1 && c2this (today) < 1) || (
				sameDay (thisAnd (today))
			));
		return {showHours, selected, isOff};
	};

	const steps = [
		{
			title: s => 'tell me about yourself',
		}, {
			title: _ => `which days can't you read?`,
			action: onDayBad,
		}
	];
	const {title, action} = steps[step];

	const Day = props => {
		const {
			n, month, year,
		} = props;
		const thisDay = new Date(year, month, n);
		const {showHours, selected, isOff} = dayCalcs(thisDay);
		const onClick = action({today, setEDay, eDay, setDaysOff, year, month, onDone: incStep, daysOff});
		const text = showHours ? timePerDay
			: selected && landscape ? nameOfThing
			: /* else */ '';
		const color = selected ? '#0080ff' : undefined;
		const background = isOff ? '#ee002d99' : undefined;
		const style = { color, background };
		const handleClick = _ => (onClick ?? I)(n);
		return (
			<CalBox size={size} style={style} className='realDay' onClick={handleClick} key={n}>
				<div style={{padding: 5}}>
					<h4> {n} </h4>
					{landscape ? <br /> : null}
					{text}
				</div>
			</CalBox>
		);
	};

	const handleMenuDone = ({parsedDate}) => {
		setEDay(parsedDate);
		incStep();
	};

	const months = eachMonthOfInterval({start: today, end: eDay});
	const date2calProps = d => {
		const month = getMonth (d);
		const year = getYear (d);
		const key = `m${month}y${year}`;
		return {month, year, Day, landscape, size, key};
	};
	const calProps = map (date2calProps) (months);

  return (
		<div style={{padding: 5}}>
			<h1>{title({nameOfThing,})}</h1>
			{step === 0 ? (
				<Menu {...{
					onDone: handleMenuDone,
					pages, setPages, rate, setRate, 
					nameOfThing, setNameOfThing,
					today,
				}}/>
			) : null}
			{step === 1 ? (
				map (Calendar) (calProps)
			) : null}
		</div>
  );
}

export default App;
