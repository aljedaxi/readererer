import {createElement, Fragment, useEffect, useState} from 'react';
import {
	snd,
	add,
	any,
	append,
	complement,
	compose,
	concat,
	div,
	elem,
	filter,
	fromPairs,
	keys,
	lift2,
	map,
	maybeToNullable,
	mult,
	Pair,
	pairs,
	parseFloat,
	parseInt as overlyComplexForThisSituationParseInt,
	pipe,
	range,
	reject,
	sub,
	sum,
} from 'sanctuary';
import {
	compareAsc,
	eachDayOfInterval,
	eachMonthOfInterval,
	formatWithOptions,
	getISODay,
	getMonth,
	getUnixTime,
	getYear,
	parseISO,
} from 'date-fns/fp';
import {startOfToday} from 'date-fns';
import * as locales from 'date-fns/locale';
import {Combobox, ComboboxInput, ComboboxList, ComboboxOption, ComboboxPopover,} from "@reach/combobox";
import "@reach/combobox/styles.css";

const contactInfo = 'hmu @ alje(at)daxi.ml';

const parseInt = overlyComplexForThisSituationParseInt (10);

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

const Menu = props => {
	const {
		onDone, pages, setPages, rate, setRate, 
		nameOfThing, setNameOfThing,
		today,
	} = props;
	const isInvalid = n => n < 1;
	const [dayString, setDayString] = useState('');
	const handleSubmit = e => {
		e.preventDefault();
		const parsedDate = parseISO (dayString);
		if (isLaterThan (today) (parsedDate)) {
			alert (`i'm afraid you've missed your ${nameOfThing}. is there anothing coming up?`);
			return;
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

const isntInRange = ({clickedDay, eDay, today, isReadingLastMinute}) => {
	const f = isReadingLastMinute ? isLaterThan : isLaterThanOrEqualTo;
	return f (clickedDay) (eDay) || isEarlierThan (today) (clickedDay);
};

// parseMinutes :: String -> Maybe Int
const parseMinutes = s => parseInt(s.slice(0, -1));
// parseTime :: String -> Maybe Int
const parseTime = s => {
	const onH = s.split('h');
	return onH.length > 1
		? lift2 (add) (parseMinutes(onH[1])) (map (mult (60)) (parseInt(onH[0])))
		: parseMinutes(onH[0]);
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
const dayCalcs = ({clickedDay, eDay, today, isReadingLastMinute, daysOff}) => {
	const sameDay = eq (0);
	const c2this = compareAsc (clickedDay);
	const sameAsThis = compose (sameDay) (c2this);
	const isOff = any (sameAsThis) (daysOff);
	const selected = sameAsThis (eDay);
	const showHours =
		!isOff &&
		!isntInRange ({clickedDay, eDay, today, isReadingLastMinute});
	return {showHours, selected, isOff};
};

const jan27th = new Date(2021, 0, 27);

const merge = o1 => o2 => Object.assign({}, o2, o1);
const borderlessInput = {
	border: 'none',
  width: '5em',
};

const Hours = ({time, onSubmit}) => {
	const [value, setValue] = useState(time);
	const onChange = setter(setValue);
	return (
		<form onSubmit={onSubmit}>
			<input style={borderlessInput} {...{value, onChange}}/>
		</form>
	)
};

const today = startOfToday();
const App = () => {
	const landscape = window.innerHeight < window.innerWidth;
	// const hoverColor = '#ffff0099';
	const size = landscape ? 150 : 50;

	const [step, setStep] = useState(0);
	const incStep = _ => setStep(succ);
	const [pages, setPages] = useState(300);
	const [rate, setRate] = useState(60);
	const [nameOfThing, setNameOfThing] = useState('Seminar');
	const [eDay, setEDay] = useState(jan27th);
	const [daysOff, setDaysOff] = useState([]);
	const [isReadingLastMinute, setIsReadingLastMinute] = useState(0);
	const [readingTimes, setReadingTimes] = useState({});
	const [customTimes, setCustomTimes] = useState({});
	const addToCustomTimes = day => minutes => setCustomTimes(merge({[getUnixTime(day)]: minutes}));

	useEffect(() => {
		const elemOfDaysOf = d => (any (datesEq (d)) (daysOff));
		const elemOfCustomTimes = d => (any (eq (getUnixTime (d))) (keys (customTimes)));
		const or = f => g => x => f(x) || g(x);

		const perMinute = rate / 60;
		const minutes = (pages / perMinute);
		const timestampsOff = map (getUnixTime) (daysOff);
		const activeCustomTimes = fromPairs (reject (p => timestampsOff.includes(p)) (pairs (customTimes)));
		const baseMinutes = minutes - sum(activeCustomTimes);

		const possibleReadingDays = eachDayOfInterval({start: today, end: eDay})
		const readingDays = reject (or (elemOfDaysOf) (elemOfCustomTimes)) (possibleReadingDays);

		const timePerCustomDay = map (formatMinutes) (activeCustomTimes);

		const daysTilDue = readingDays.length - daysOff.length - isReadingLastMinute;
		const baseReadingTime = calcTimePerDay (baseMinutes) (daysTilDue);

		const r = map (d => Pair (getUnixTime(d).toString()) (baseReadingTime)) (readingDays);
		setReadingTimes(fromPairs(concat (r) (pairs (timePerCustomDay))));
	}, [pages, rate, eDay, daysOff, isReadingLastMinute, customTimes]);

	const handleSubmit = day => e => {
		e.preventDefault();
		const input = e.target[0];
		const maybeNewTime = parseTime(input.value.trim());
		map (addToCustomTimes (day)) (maybeNewTime);
	};

	const title = [
		'tell me about yourself',
		`which days can't you read?`,
	][step];

	const Day = props => {
		const {
			n, month, year,
		} = props;
		const thisDay = new Date(year, month, n);
		const {showHours, selected, isOff} = dayCalcs({clickedDay: thisDay, eDay, today, isReadingLastMinute, daysOff});

		const readingTimeThisDay = showHours && <Hours time={readingTimes[getUnixTime(thisDay)]} onSubmit={handleSubmit(thisDay)}/>;

		const handleClick = _ => {
			const clickedDay = new Date(year, month, n)
			if (isntInRange({clickedDay, eDay, today, isReadingLastMinute})) return;
			elem (clickedDay) (daysOff)
				? setDaysOff(filter(complement(datesEq(clickedDay))))
				: setDaysOff(append(clickedDay));
		};
		const buttonStuff = { onClick: handleClick, role: 'button', style: {cursor: 'pointer'}, title: `${isOff ? 'add' : 'remove'} this day from the reading days`};

		const color = selected ? '#0080ff' : undefined;
		const titleProps = showHours || isOff ? buttonStuff : {};
		return (
			<CalBox size={size} style={{color}} className='realDay' key={n}>
				<div style={{padding: 5}}>
					<h4 {...titleProps}>
						{createElement(isOff ? 's' : Fragment, {}, n)}
					</h4>
					{landscape ? <br /> : null}
					{readingTimeThisDay}
					{showHours && selected && landscape && <br/>}
					{selected && landscape && nameOfThing}
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

	const valueToText = x => x ? 'yes' : 'no';
	const textToValue = x => x === 'yes' ? 1 : 0;
	const handleProcrastinationChange = e => setIsReadingLastMinute(textToValue(e.target.value));
  return (
		<div style={{height: '100%', padding: 5}}>
			<header>
				<h1>{title}</h1>
			</header>
			<main>
				{step === 0 ? (
					<Menu {...{
						onDone: handleMenuDone,
						pages, setPages, rate, setRate, 
						nameOfThing, setNameOfThing,
						today,
					}}/>
				) : null}
				{step === 1 ? (
					<>
						<div>
							<label htmlFor="combobox">
								will you be reading the day of? 
							</label>
							<Combobox id='combobox'>
								<ComboboxInput onChange={handleProcrastinationChange}/>
								<ComboboxPopover>
									<ComboboxList>
										{[0,1].map(n => <ComboboxOption key={n} value={valueToText(n)}/>)}
									</ComboboxList>
								</ComboboxPopover>
							</Combobox>
						</div>
						{map (Calendar) (calProps)}
					</>
				) : null}
			</main>
			<footer>{contactInfo}</footer>
		</div>
  );
}

export default App;
