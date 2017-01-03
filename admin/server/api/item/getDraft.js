module.exports = function (req, res) {
	if (req.list.options.draft) {
		var draftList = req.keystone.list(req.params.list + '_draft');

		if (!draftList) {
			return res.json({ hasDraft: false });
		}

		draftList.model.findOne({ __parent: req.params.id })
			.exec((err, item) => {
				if (err) {
					return res.json({ hasDraft: false, err });
				}

				res.json({ hasDraft: !!item, draft: item && item.id });
			});
	} else {
		res.json({ hasDraft: false });
	}
};
