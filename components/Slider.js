import * as React from 'react';
import { Range, getTrackBackground } from 'react-range';

const STEP = 0.1;
const MIN = 0;
const MAX = 100;

class LabeledTwoThumbs extends React.Component {
	
	// colors: ['#ccc', '#548BF4', '#ccc'],
	// values => this.setState({ values })
	render() {
		const dataMin = Math.min(... this.props.data)
		const dataMax = Math.max(... this.props.data)
			
		const splitCount = Math.min(50, this.props.data.length)
		
		var sampledData
		if (splitCount == this.props.data.length)
			sampledData = this.props.data
		else
			sampledData = [...Array(splitCount).keys()].map( i => this.props.data[Math.round((this.props.data.length-1)*i/(splitCount-1))])
			
		const valToSplit = val => {
			return val > dataMax ? sampledData.length-1 : sampledData.findIndex(e => e >= val)
		}
		
		const valuesAsSplits = this.props.values.map( v => valToSplit(v) )
		
		/*console.log('------------------------------')
		console.log('dataMin:',dataMin)
		console.log('dataMax:',dataMax)
		console.log('splitCount:',splitCount)
		console.log('sampledData:',sampledData)
		console.log('this.props.values:',this.props.values)
		console.log('valuesAsSplits:',valuesAsSplits)*/
		
		const onChange = ([min,max]) => {
			if (this.props.onChange)
				this.props.onChange([sampledData[min],sampledData[max]])
		}
	
		
		return (
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					flexWrap: 'wrap',
					paddingLeft: '24px',
					paddingRight: '24px'
				}}
			>
				<Range
					disabled={this.props.disabled}
					values={valuesAsSplits}
					step={1}
					min={0}
					max={splitCount-1}
					onChange={onChange}
					renderTrack={({ props, children, disabled }) => (
						<div
							onMouseDown={props.onMouseDown}
							onTouchStart={props.onTouchStart}
							style={{
								...props.style,
								height: '36px',
								display: 'flex',
								width: '100%'
							}}
						>
							<div
								ref={props.ref}
								style={{
									height: '5px',
									width: '100%',
									borderRadius: '4px',
									background: getTrackBackground({
										values: valuesAsSplits,
										colors: disabled ? ['#ccc', '#ccc'] : ['#ccc', '#548BF4', '#ccc'],
										min: 0,
										max: splitCount-1
									}),
									alignSelf: 'center'
								}}
							>
								{children}
							</div>
						</div>
					)}
					renderThumb={({ index, props, isDragged }) => (
						<div
							{...props}
							style={{
								...props.style,
								height: '42px',
								width: '42px',
								borderRadius: '4px',
								backgroundColor: '#FFF',
								display: 'flex',
								justifyContent: 'center',
								alignItems: 'center',
								boxShadow: '0px 2px 6px #AAA'
							}}
						>
							<div
								style={{
									position: 'absolute',
									top: '50px',
									color: '#fff',
									fontWeight: 'bold',
									fontSize: '14px',
									fontFamily: 'Arial,Helvetica Neue,Helvetica,sans-serif',
									padding: '4px',
									borderRadius: '4px',
									backgroundColor: this.props.disabled ? '#999' : '#548BF4',
									textAlign: "center"
								}}
							>
							{'renderLabel' in this.props ? this.props.renderLabel(this.props.values[index]) : this.props.values[index].toFixed(0)}
							</div>
							<div
								style={{
									height: '16px',
									width: '5px',
									backgroundColor: isDragged ? '#548BF4' : '#CCC'
								}}
							/>
						</div>
					)}
				/>
			</div>
		);
	}
}

export default LabeledTwoThumbs;
