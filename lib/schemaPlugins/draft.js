var keystone = require('../../');

var Types = keystone.Field.Types;
var historyModelSuffix = '_draft';

function getDraftModelName (list) {
	return list.options.schema.collection + historyModelSuffix;
}

function getDraftModel (list) {
	var name = getDraftModelName(list);
	var model = new keystone.List(name, {
		hidden: true,
	});

	// Clone the fields from the previous list
	model.add.apply(model, list.schemaFields);

	// Add link, not a relationship though
	model.add({
		__parent: {
			type: Types.Text,
		},
	});

	// And register the new draft list
	model.register();

	return model;
}

/**
 * List draft option
 *
 * When enabled, allows a 'draft' state per item. Useful for previewing changes.
 */
module.exports = function history () {
	var list = this;

	// Assign the draft model to the list
	list.DraftModel = getDraftModel(list);
};
