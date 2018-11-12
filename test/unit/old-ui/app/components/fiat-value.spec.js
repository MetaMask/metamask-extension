import React from 'react'
import assert from 'assert'
import FiatValue from '../../../../../old-ui/app/components/fiat-value'
import expect from 'expect'
import { shallow } from 'enzyme'

let fiatValue

describe('FiatValue component', () => {
	beforeEach(function () {
		fiatValue = new FiatValue()
	})

	describe('countSignificantDecimals(val, len) function', () => {
		it('returns correct significant decimals', () => {
			assert.equal(6, fiatValue.countSignificantDecimals(0.00001232756347, 2))
			assert.equal(4, fiatValue.countSignificantDecimals(0.00010000003454305430504350, 2))
			assert.equal(0, fiatValue.countSignificantDecimals(1.0000, 2))
			assert.equal(0, fiatValue.countSignificantDecimals(2, 2))
			assert.equal(3, fiatValue.countSignificantDecimals('2.03243', 2))
		})
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
