import { expect } from 'chai';
import { watchObject, Change } from '../shared/watched-object';
// import { shallowMount } from '@vue/test-utils';


describe (__filename.substr (__filename.lastIndexOf ('/') + 1), () => {
	var obj : { peng: string[], asdf: { peng: string } } = {
		peng: ['puff'],
		asdf: null
	};
	var lastChange : Change = null;
	it ('initializes correctly', () => {
		obj = watchObject (obj, null, change => lastChange = change);
		obj.peng[0] = 'peng';
		expect (lastChange.prop).to.be.an ('array').of.length (2);
	});
	it ('calls multiple listeners', () => {
		obj.asdf = { peng: '' };
		var obj2 = {
			fdsa: obj.asdf
		};
		var lastChange2 : Change = null;
		obj2 = watchObject (obj2, null, change => lastChange2 = change);

		obj.asdf.peng = 'fdsa';
		expect (lastChange.newValue).to.equal (lastChange2.newValue);
		expect (lastChange.prop.join ('.')).to.equal ('asdf.peng');
		expect (lastChange2.prop.join ('.')).to.equal ('fdsa.peng');
	});
	it ('removes listeners', () => {
		var o3 = obj.asdf;

		o3.peng = 'yay';
		expect (lastChange.newValue).to.equal ('yay');

		obj.asdf = { peng: 'asdf ' };
		o3.peng = 'noes';
		expect (lastChange.newValue).to.not.equal ('noes');
	});
	// it ('behaves like an array', () => {
	// 	var obj = {
	// 		'peng': (<any[]>['puff'])
	// 	};
	// 	var origObject = obj;
	// 	var lastChange : Change = null;
	// 	obj = watchObject (obj, null, change => {
	// 		console.log ('obj' + JSON.stringify (change.prop) + ' => ' + JSON.stringify (change.newValue));
	// 		lastChange = change;
	// 	});
	// 	expect (obj).not.to.equal (origObject);
	// 	expect (JSON.stringify (obj)).to.equal (JSON.stringify (origObject));
	// 	expect (obj.peng).to.be.an ('array').of.length (1);
		
	// 	obj.peng[0] = 'asdf!';
	// 	console.log ({ obj, lastChange });
	// 	expect (lastChange).not.to.equal (null);
	// 	expect (lastChange.prop.join ('.')).to.equal ('peng.0');
	// 	expect (lastChange.newValue).to.equal ('asdf!');
	// 	expect (JSON.stringify (obj)).not.to.equal (JSON.stringify (origObject));
	// 	expect (obj.peng).to.be.an ('array').of.length (1);
		
	// 	var o2 = { peng: null };
	// 	obj.peng.push (o2);
	// 	expect (obj.peng).to.be.an ('array').of.length (2);
	// 	o2.peng = 'puff';
	// 	expect (obj.peng[1].peng).to.equal (null);

	// 	var o3 = obj.peng[1];
	// 	expect (o3).not.to.equal (o2);
	// 	o3.peng = 'aosdifh';
	// 	expect (obj.peng[1].peng).to.equal (o3.peng);
	// 	obj['asdf'] = null;
	// 	o3.peng = 'puff'
	// });
});
