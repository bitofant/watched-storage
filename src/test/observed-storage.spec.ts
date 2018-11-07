import { expect } from 'chai';
import { observedStorage, applyChange } from '../shared/observed-storage';


describe (__filename.substr (__filename.lastIndexOf ('/') + 1), () => {
	it ('observes correctly', () => {
		const expectedChanges = [
			{ prop: ['0'], oldValue: undefined, newValue: 'asdf' },
			{ prop: ['1'], oldValue: undefined, newValue: 'fdsa' },
			{ prop: ['length'], oldValue: 2, newValue: 0 }
		];

		var peng = observedStorage<string> (changes => {
			changes.forEach (change => {
				expect (expectedChanges.length).to.be.greaterThan (0);
				var expectedChange = expectedChanges[0];
				expectedChanges.splice (0, 1);
				expect (JSON.stringify (change.prop)).to.equal (JSON.stringify (expectedChange.prop));
				expect (JSON.stringify (change.oldValue)).to.equal (JSON.stringify (expectedChange.oldValue));
				expect (JSON.stringify (change.newValue)).to.equal (JSON.stringify (expectedChange.newValue));
			});
		});

		peng.push ('asdf');
		expect (peng.join (',')).to.equal ('asdf');

		peng.push ('fdsa');
		expect (peng.join (',')).to.equal ('asdf,fdsa');

		peng.splice (0, 2);
		expect (peng.length).to.equal (0);

		setTimeout (() => {
			expect (expectedChanges.length).to.equal (0);
		}, 10);
	});

	it ('applies changes', () => {
		var arr = [1, 2];
		applyChange (arr, ['0'], 2);
		expect (arr[0]).to.equal (2);
		expect (arr[1]).to.equal (2);
		
		applyChange (arr, ['2'], 3);
		expect (arr[0]).to.equal (2);
		expect (arr[1]).to.equal (2);
		expect (arr[2]).to.equal (3);
	});

	it ('watches for deep changes', () => {
		interface ComplexObject {
			name : { first : string, last : string }
		}
		var peng = observedStorage<ComplexObject> (changes => {
			expect (changes.length).to.equal (3);
			var c1 = changes[0], c2 = changes[1], c3 = changes[2];
			expect (c1.prop.join ('.')).to.equal ('0');
			expect (c2.prop.join ('.')).to.equal ('0');
			expect (c3.prop.join ('.')).to.equal ('0.name.last');
			expect (c3.oldValue).to.equal ('peng');
			expect (c3.newValue).to.equal ('Asdf');
		});
		peng.push ({
			name: {
				first: 'Peng',
				last: 'puff'
			}
		});
		peng[0] = {
			name: {
				first: 'Puff',
				last: 'peng'
			}
		};
		peng[0].name.last = 'Asdf';
		expect (JSON.stringify (peng)).to.equal (JSON.stringify ([{
			name: {
				first: 'Puff',
				last: 'Asdf'
			}
		}]));
	});

});