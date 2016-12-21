module.exports = function (req, res) {
	var keystone = req.keystone;
	if (!keystone.security.csrf.validate(req)) {
		return res.apiError(403, 'invalid csrf');
	}
	req.list.model.findById(req.params.id, function (err, item) {
		if (err) return res.status(500).json({ error: 'database error', detail: err });
		if (!item) return res.status(404).json({ error: 'not found', id: req.params.id });
		req.list.updateItem(item, req.body, { files: req.files, user: req.user }, function (err) {
			if (err) {
				var status = err.error === 'validation errors' ? 400 : 500;
				var error = err.error === 'database error' ? err.detail : err;
				return res.apiError(status, error);
			}
			// Reload the item from the database to prevent save hooks or other
			// application specific logic from messing with the values in the item
			req.list.model.findById(req.params.id, function (err, updatedItem) {
				res.json(req.list.getData(updatedItem));
			});
		});
	};

	req.list.model.findById(req.params.id, function (err, item) {
		if (err) return res.status(500).json({ error: 'database error', detail: err });
		if (!item) return res.status(404).json({ error: 'not found', id: req.params.id });

		// Does this list have drafts enabled? If so - is there a draft that needs updating first?
		if (req.list.DraftModel) {
			req.list.DraftModel.model.findOne({ __parent: req.params.id })
				.exec((err, draft) => {
					if (err) {
						return res.status(500).json({ error: 'database error', detail: err });
					}

					if (!draft) {
						return doUpdate(item, req.body, sendResponse);
					}

					// Clone the draft, update the item with the draft database
					// then reupdate with the posted req body
					var cloned = draft.toObject();
					delete cloned._id;
					delete cloned.__v;
					delete cloned.__rev;

					req.list.model.update({ _id: req.params.id }, cloned, function () {
						doUpdate(item, req.body, sendResponse);
					});
				});
		} else {
			doUpdate(item, req.body, sendResponse);
		}
	});
};
