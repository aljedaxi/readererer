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
		Day,
		landscape: isLegitLandscape, size,
	} = props;
	const calWidth = size * 7;
	const landscape = isLegitLandscape || window.innerWidth < calWidth;
	const d = dater (year) (month);
	const daysInM = range (0) (getDaysInM (year) (month));
	const days = map (n => ({ 
		n: succ (n), month, year,
	})) (daysInM);
	const emptyDays = sub (getISODay (d (days[0].n))) (6);
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
						<div key={s} style={{width: size}}>
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
					map (n => <CalBox key={n} size={size}/>) (range (0) (emptyDays))
				}
				{
					map (Day) (days)
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
const setter = s => e => s(e.target.value);
const isInvalid = n => n < 1;
const Menu = props => {
	const {
		onDone, pages, setPages, rate, setRate,
		nameOfThing, setNameOfThing,
	} = props;
	const handleSubmit = e => {
		e.preventDefault();
		if (!pages || !rate || !nameOfThing) {
			alert('a horse walks into a cafe and asks for coffee with no milk. the barista says "we don\'t have coffee with no milk, but i can give you coffee with no cream".');
			return;
		}
		const hopefullyBoth = map (pipe([parseFloat, maybeToNullable])) ({pages: pages.toString(), rate: rate.toString()});
		if (any (isInvalid) (hopefullyBoth)) {
			alert('a horse walks into a cafe and asks for coffee with no milk. the barista says "we don\'t have coffee with no milk, but i can give you coffee with no cream".');
			return;
		}
		onDone ({...hopefullyBoth, nameOfThing});
	};
	const row = {width: '100%'};
	return (
		<form onSubmit={handleSubmit}>
			<div style={row}>
				i have to read
				<Input id='pages' name='pages' type='number' onChange={setter(setPages)} value={pages} />
				pages of actual content for my upcoming
				<Input 
					style={{width: '7em'}} 
					noSecondSpace
					id='nameOfThing' 
					name='nameOfThing' 
					type='text' 
					onChange={setter(setNameOfThing)} 
					value={nameOfThing} 
				/>
				.
			</div>
			<div style={row}>
				<label>
					i read about
					<Input id='rate' name='rate' type='number' onChange={setter(setRate)} value={rate} 
						title='60 is about average, but it varies wildly based on the content, writing style, and typesetting'
					/>
					pages in an hour.
				</label>
			</div>
			<div style={{...row, padding: 5}}>
				<input style={{border: '1px solid black', background: 'transparent'}} type="submit" />
			</div>
		</form>
	);
};

const datesEq = d => e => compareAsc (d) (e) === 0;

const steps = [
	{
		Component: Menu,
		title: s => 'tell me about yourself',
	}, {
		Component: Calendar,
		title: ({nameOfThing}) => `when's your ${nameOfThing}?`,
		action: ({setEDay, year, month, onDone}) => n => {
			setEDay(new Date(year, month, n));
			onDone();
		},
	}, {
		Component: Calendar,
		title: _ => `which days can't you read?`,
		action: ({setDaysOff, daysOff, year, month}) => n => {
			const calDay = new Date(year, month, n)
			return elem (calDay) (daysOff) 
				? setDaysOff(filter(complement (datesEq (calDay))))
				: setDaysOff(append(calDay));
		},
	}
];
const formatMinutes = uglyM => {
	const m = Math.round(uglyM);
	const hours = m > 60 ? Math.floor(m / 60) : 0;
	const minutes = m % 60;
	return hours ? `${hours}h${minutes}m` : `${minutes}m`;
};
const c = minutes => days => {
	if (days <= 1) return minutes;
	if (minutes <= 0 || days <= 0) return 0;
	return minutes / days;
};
const calcTimePerDay = m => compose (formatMinutes) (c (m));

const eq = x => y => x === y;
const App = () => {
	const [step, setStep] = useState(0);
	const incStep = _ => setStep(succ);
	const [pages, setPages] = useState(0);
	const [rate, setRate] = useState(60);
	const perMinute = rate / 60;
	const [nameOfThing, setNameOfThing] = useState('Seminar');
	const [eDay, setEDay] = useState();
	const [daysOff, setDaysOff] = useState([]);

	const landscape = window.innerHeight < window.innerWidth;
	const today = startOfToday();
	const month = 0;
	const year = 2021;
	const hoverColor = 'yellow';
	const size = landscape ? 150 : 50;

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
			eDay && !isOff &&
			!(!eDay || compareAsc (today) (eDay) < 1) && (
			(c2this (eDay) === 1 && c2this (today) < 1) || (
				sameDay (thisAnd (today))
			));
		return {showHours, selected, isOff};
	};

	const {Component, title, action} = steps[step];
	const mainProps = {
		setPages, setRate, setNameOfThing, 
		pages, rate, nameOfThing, day: eDay, month, year,
		landscape, size,
		onDone: incStep,
		Day: props => {
			const {
				n, month, year,
			} = props;
			const thisDay = new Date(year, month, n);
			const {showHours, selected, isOff} = dayCalcs(thisDay);
			const onClick = action({setEDay, setDaysOff, year, month, onDone: incStep, daysOff});
			const text = showHours ? timePerDay
				: selected && landscape ? nameOfThing
				: /* else */ '';
			const {container} = useDayStyles({hoverColor});
			const color = selected ? '#e000ff' : undefined;
			const background = isOff ? 'red' : undefined;
			const style = { color, background };
			const handleClick = _ => (onClick ?? I)(n);
			return (
				<CalBox size={size} style={style} className={container} onClick={handleClick} key={n}>
					<h4>
						{n}
						{landscape ? <br /> : null}
						<br />
						{text}
					</h4>
				</CalBox>
			);
		},
	};
  return (
		<div style={{padding: 5}}>
			<h1>{title({nameOfThing,})}</h1>
			<Component {...mainProps} />
		</div>
  );
}

export default App;
