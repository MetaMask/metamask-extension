import React from 'react'
import FiatValue from '../../../../../old-ui/app/components/fiat-value'
import expect from 'expect'
import { shallow } from 'enzyme'

let fiatValue

describe('FiatValue component', () => {
	beforeEach(function () {
		fiatValue = new FiatValue()
	})

	describe('fiatDisplay(fiatDisplayNumber, valueStyle, dimStyle, fiatSuffix) function', () => {
		const valueStyle = {
			width: '100%',
			textAlign: 'right',
			fontSize: '14px',
			color: '#ffffff',
		}

		const dimStyle = {
			color: '#60db97',
			marginLeft: '5px',
			fontSize: '14px',
		}

		it('returns correct object', () => {
			expect(fiatValue.fiatDisplay('N/A')).toEqual(<div/>)
			const wrapper = shallow(fiatValue.fiatDisplay('10', valueStyle, dimStyle, 'POA'))
			expect(wrapper.find('.fiat-val').text()).toEqual('10')
			expect(wrapper.find('.fiat-dim').text()).toEqual('POA')
		})
	})
})
