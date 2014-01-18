/*
 * jQuery Notebook
 *
 * Copyright 2014, Raphael Cruzeiro = http://raphaelcruzeiro.eu/
 * Released under the MIT License
 * http://opensource.org/licenses/MIT
 *
 * Github https://github.com/raphaelcruzeiro/jquery-notebook
 * Version 0.5
 *
 * Some functions of this pluging were based on Jacob Kelley's Medium.js
 * https://github.com/jakiestfu/Medium.js/
 */

(function($, d, w) {

	var isMac = w.navigator.platform == 'MacIntel',
		mouseX = 0,
		mouseY = 0,
		cache = {
			command: false,
			shift: false
		},
		modifiers = {
			66: 'bold',
			73: 'italic',
			85: 'underline',
			86: 'paste'
		},
		utils = {
			keyboard: {
				isCommand: function(e, callbackTrue, callbackFalse) {
					if (isMac && e.metaKey || !isMac && e.ctrlKey) {
						callbackTrue();
					} else {
						callbackFalse();
					}
				},
				isShift: function(e, callbackTrue, callbackFalse) {
					if (e.shiftKey) {
						callbackTrue();
					} else {
						callbackFalse();
					}
				},
				isModifier: function(e, callback) {
					var key = e.which,
						cmd = modifiers[key];
					if (cmd) {
						callback.call(this, cmd);
					}
				}
			},
			html: {
				addTag: function(elem, tag, focus, editable) {
					var newElement = $(d.createElement(tag));
					newElement.attr('contenteditable', Boolean(editable));
					newElement.append(' ');
					elem.append(newElement);
					if (focus) {
						cache.focusedElement = elem.children().last();
						utils.cursor.set(elem, 0, cache.focusedElement);
					}
					return newElement;
				}
			},
			cursor: {
				set: function(editor, pos, elem) {
					if (d.createRange) {
						var range = d.createRange(),
							selection = w.getSelection(),
							lastChild = editor.children().last(),
							length = lastChild.html().length - 1,
							toModify = elem ? elem[0] : lastChild[0],
							theLength = typeof pos !== 'undefined' ? pos : length;
						range.setStart(toModify, theLength);
						range.collapse(true);
						selection.removeAllRanges();
						selection.addRange(range);
					} else {
						var range = d.body.createTextRange();
						range.moveToElementText(elem);
						range.collapse(false);
						range.select();
					}
				}
			},
			selection: {
				save: function() {
					if (w.getSelection) {
						var sel = w.getSelection();
						if (sel.rangeCount > 0) {
							return sel.getRangeAt(0);
						}
					} else if (d.selection && d.selection.createRange) { // IE
						return d.selection.createRange();
					}
					return null;
				},
				restore: function(range) {
					if (range) {
						if (w.getSelection) {
							var sel = w.getSelection();
							sel.removeAllRanges();
							sel.addRange(range);
						} else if (d.selection && range.select) { // IE
							range.select();
						}
					}
				}
			}
		},
		bubble = {
			updatePos: function(editor, elem) {
				var sel = w.getSelection(),
					range = sel.getRangeAt(0),
					boundary = range.getBoundingClientRect(),
					bubbleWidth = elem.width(),
					bubbleHeight = elem.height(),
					offset = editor.offset().left,
					pos = {
						top: boundary.top - 9 + w.pageYOffset - bubbleHeight - editor.find('p').height(),
						left: (boundary.left + boundary.width / 2) - bubbleWidth / 2 - offset
					};
				console.log(boundary);
				elem.css(pos);
			},
			buildMenu: function(editor, elem) {
				var ul = utils.html.addTag(elem, 'ul', false, false);
				for (var cmd in modifiers) {
					var li = utils.html.addTag(ul, 'li', false, false);
					var btn = utils.html.addTag(li, 'button', false, false);
					btn.attr('editor-command', modifiers[cmd]);
					btn.addClass(modifiers[cmd]);
				}
				var li = utils.html.addTag(ul, 'li', false, false);
				var btn = utils.html.addTag(li, 'button', false, false);
				btn.attr('editor-command', 'link');
				btn.addClass('link');
				elem.find('button').click(function(e) {
					e.preventDefault();
					console.log('click');
					var cmd = $(this).attr('editor-command');
					if (cmd === 'bold') {
						events.commands.bold.call(editor, e);
					} else if (cmd === 'italic') {
						events.commands.italic.call(editor, e);
					} else if (cmd === 'underline') {
						events.commands.underline.call(editor, e);
					}
				});
			},
			show: function() {
				var tag = $(this).find('.bubble');
				if (!tag.length) {
					var tag = utils.html.addTag($(this), 'div', false, false);
					tag.addClass('bubble');
					bubble.buildMenu(this, tag);
				}
				tag.show();
				bubble.updatePos($(this), tag);
			},
			clear: function() {
				$(this).find('.bubble').hide();
			}
		},
		actions = {
			bindEvents: function(elem) {
				elem.keydown(rawEvents.keydown);
				elem.keyup(rawEvents.keyup);
				elem.focus(rawEvents.focus);
				elem.bind('paste', events.paste);
				elem.mousedown(rawEvents.mouseClick);
				elem.mouseup(rawEvents.mouseUp);
				elem.mousemove(rawEvents.mouseMove);
			},
			setPlaceholder: function(e) {
				if (/^\s*$/.test($(this).text())) {
					$(this).empty();
					var placeholder = utils.html.addTag($(this), 'p').addClass('placeholder');
					placeholder.append($(this).attr('editor-placeholder'));
					utils.html.addTag($(this), 'p', false, true);
				} else {
					console.log('remove placeholder');
					$(this).find('.placeholder').remove();
				}
			},
			preserveElementFocus: function() {
				var anchorNode = w.getSelection() ? w.getSelection().anchorNode : d.activeElement;
				if (anchorNode) {
					var current = anchorNode.parentNode,
						diff = current !== cache.focusedElement,
						children = this.children,
						elementIndex = 0;
					if (current === this) {
						current = anchorNode;
					}
					for (var i = 0; i < children.length; i++) {
						if (current === children[i]) {
							elementIndex = i;
							break;
						}
					}
					if (diff) {
						cache.focusedElement = current;
						cache.focusedElementIndex = elementIndex;
					}
				}
			},
			prepare: function(elem, options) {
				if (typeof options.mode != 'undefined') {
					elem.attr('editor-mode', options.mode);
				}
				if (typeof options.placeholder != 'undefined') {
					elem.attr('editor-placeholder', options.placeholder);
				} else {
					elem.attr('editor-placeholder', 'Your text here...');
				}
				elem.attr('contenteditable', true);
				elem.css('position', 'relative');
				elem.addClass('jquery-notebook editor');
				actions.setPlaceholder.call(elem, {});
				actions.preserveElementFocus.call(elem);
			}
		},
		rawEvents = {
			keydown: function(e) {
				utils.keyboard.isCommand(e, function() {
					cache.command = true;
				}, function() {
					cache.command = false;
				});
				utils.keyboard.isShift(e, function() {
					cache.shift = true;
				}, function() {
					cache.shift = false;
				});
				utils.keyboard.isModifier.call(this, e, function(modifier) {
					if (cache.command) {
						events.commands[modifier].call(this, e);
					}
				});
				if (e.which === 13) {
					events.enterKey.call(this, e);
				}
			},
			keyup: function(e) {
				utils.keyboard.isCommand(e, function() {
					cache.command = false;
				}, function() {
					cache.command = true;
				});
				actions.preserveElementFocus.call(this);
				actions.setPlaceholder.call(this);
			},
			focus: function(e) {
				cache.command = false;
				cache.shift = false;
			},
			mouseClick: function(e) {
				var elem = this;
				if (e.button === 2) {
					setTimeout(function() {
						bubble.show.call(elem);
					}, 50);
					e.preventDefault();
					return;
				}
				if ($(this).find('.bubble:visible').length) {
					var bubbleTag = $(this).find('.bubble:visible'),
						bubbleX = bubbleTag.offset().left,
						bubbleY = bubbleTag.offset().top,
						bubbleWidth = bubbleTag.width(),
						bubbleHeight = bubbleTag.height();
					if (mouseX > bubbleX && mouseX < bubbleX + bubbleWidth &&
						mouseY > bubbleY && mouseY < bubbleY + bubbleHeight) {
						return;
					}
				}
				bubble.clear.call(elem);
			},
			mouseUp: function(e) {
				var txt = '';
				if (w.getSelection) {
					txt = w.getSelection().toString();
				} else if (d.getSelection) {
					txt = d.getSelection().toString();
				} else if (d.selection) {
					txt = d.selection.createRange().text;
				}
				if (txt !== '') {
					bubble.show.call(this);
				} else {
					bubble.clear.call(this);
				}
			},
			mouseMove: function(e) {
				mouseX = e.pageX;
				mouseY = e.pageY;
			}
		},
		events = {
			commands: {
				bold: function(e) {
					e.preventDefault();
					d.execCommand('bold', false);
				},
				italic: function(e) {
					e.preventDefault();
					d.execCommand('italic', false);
				},
				underline: function(e) {
					e.preventDefault();
					d.execCommand('underline', false);
				},
				paste: function(e) {
					var elem = $(this);
					setTimeout(function() {
						elem.find('*').each(function() {
							var current = $(this);
							$.each(this.attributes, function() {
								current.removeAttr(this.name);
							});
						});
					}, 100);
				},
			},
			enterKey: function(e) {
				if ($(this).attr('editor-mode') === 'inline') {
					e.preventDefault();
					return;
				}
			}
		};

	$.fn.notebook = function(options) {
		actions.prepare(this, options);
		actions.bindEvents(this);
		return this;
	};

})(jQuery, document, window);
