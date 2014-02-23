/*
 * jQuery Notebook 0.5
 *
 * Copyright (c) 2014
 * Raphael Cruzeiro - http://raphaelcruzeiro.eu/
 * Otávio Soares
 *
 * Released under the MIT License
 * http://opensource.org/licenses/MIT
 *
 * Github https://github.com/raphaelcruzeiro/jquery-notebook
 * Version 0.5
 *
 * Some functions of this plugin were based on Jacob Kelley's Medium.js
 * https://github.com/jakiestfu/Medium.js/
 */

(function($, d, w) {

  /*
   * This module deals with the CSS transforms. As it is not possible to easily
   * combine the transform functions with JavaScript this module abstract those
   * functions and generates a raw transform matrix, combining the new transform
   * with the others that were previously applied to the element.
   */

  var transform = (function() {
    var matrixToArray = function(str) {
      if (!str || str == 'none') {
        return [1, 0, 0, 1, 0, 0];
      }
      return str.match(/(-?[0-9\.]+)/g);
    };

    var getPreviousTransforms = function(elem) {
      return elem.css('-webkit-transform') || elem.css('transform') || elem.css('-moz-transform') ||
        elem.css('-o-transform') || elem.css('-ms-transform');
    };

    var getMatrix = function(elem) {
      var previousTransform = getPreviousTransforms(elem);
      return matrixToArray(previousTransform);
    };

    var applyTransform = function(elem, transform) {
      elem.css('-webkit-transform', transform);
      elem.css('-moz-transform', transform);
      elem.css('-o-transform', transform);
      elem.css('-ms-transform', transform);
      elem.css('transform', transform);
    };

    var buildTransformString = function(matrix) {
      return 'matrix(' + matrix[0] +
        ', ' + matrix[1] +
        ', ' + matrix[2] +
        ', ' + matrix[3] +
        ', ' + matrix[4] +
        ', ' + matrix[5] + ')';
    };

    var getTranslate = function(elem) {
      var matrix = getMatrix(elem);
      return {
        x: parseInt(matrix[4]),
        y: parseInt(matrix[5])
      };
    };

    var scale = function(elem, _scale) {
      var matrix = getMatrix(elem);
      matrix[0] = matrix[3] = _scale;
      var transform = buildTransformString(matrix);
      applyTransform(elem, transform);
    };

    var translate = function(elem, x, y) {
      var matrix = getMatrix(elem);
      matrix[4] = x;
      matrix[5] = y;
      var transform = buildTransformString(matrix);
      applyTransform(elem, transform);
    };

    var rotate = function(elem, deg) {
      var matrix = getMatrix(elem);
      var rad1 = deg * (Math.PI / 180);
      var rad2 = rad1 * -1;
      matrix[1] = rad1;
      matrix[2] = rad2;
      var transform = buildTransformString(matrix);
      applyTransform(elem, transform);
    };

    return {
      scale: scale,
      translate: translate,
      rotate: rotate,
      getTranslate: getTranslate
    };
  })();

  var Notebook = function(element, options) {
    var self = this,
      mouseX = 0,
      mouseY = 0,
      cache = {
        command: false,
        shift: false,
        isSelecting: false
      },
      modifiers = {
        66: 'bold',
        73: 'italic',
        85: 'underline',
        112: 'h1',
        113: 'h2',
        122: 'undo'
      };

    $.extend(self, {
      init: function() {
        self.element = $(element);
        self.options = options;
        self.utils = new Utils();
        self.bubble = new notebookBubble(self);

        self.prepare();
        self.bindEvents();
      },
      bindEvents: function(elem) {
        self.element.keydown(self.rawEvents.keydown);
        self.element.keyup(self.rawEvents.keyup);
        self.element.focus(self.rawEvents.focus);
        self.element.bind('paste', self.events.paste);
        self.element.mousedown(self.rawEvents.mouseClick);
        self.element.mouseup(self.rawEvents.mouseUp);
        self.element.mousemove(self.rawEvents.mouseMove);
        self.element.blur(self.rawEvents.blur);
        $('body').mouseup(function(e) {
          if (e.target == e.currentTarget && cache.isSelecting) {
            self.rawEvents.mouseUp(e);
          }
        });
      },
      setPlaceholder: function(e) {
        if (/^\s*$/.test(self.element.text())) {
          self.element.empty();
          var placeholder = self.utils.html.addTag(self.element, 'p').addClass('placeholder');
          placeholder.append(self.element.attr('editor-placeholder'));
          self.utils.html.addTag(self.element, 'p', typeof e.focus != 'undefined' ? e.focus : false, true);
        } else {
          self.element.find('.placeholder').remove();
        }
      },
      removePlaceholder: function(e) {
        self.element.find('.placeholder').remove();
      },
      preserveElementFocus: function() {
        var anchorNode = w.getSelection() ? w.getSelection().anchorNode : d.activeElement;
        if (anchorNode) {
          var current = anchorNode.parentNode,
            diff = current !== cache.focusedElement,
            children = self.element[0].children,
            elementIndex = 0;
          if (current === self.element[0]) {
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
      prepare: function() {
        self.element.attr('editor-mode', self.options.mode);
        self.element.attr('editor-placeholder', self.options.placeholder);
        self.element.attr('contenteditable', true);
        self.element.css('position', 'relative');
        self.element.addClass('jquery-notebook editor');
        self.setPlaceholder({});
        self.preserveElementFocus();
        if (options.autoFocus === true) {
          var firstP = self.element.find('p:not(.placeholder)');
          self.utils.cursor.set(self.element, 0, firstP);
        }
      },
      rawEvents: {
        keydown: function(e) {
          var elem = this;
          if (cache.command && e.which === 65) {
            setTimeout(function() {
              self.bubble.show();
            }, 50);
          }
          self.utils.keyboard.isCommand(e, function() {
            cache.command = true;
          }, function() {
            cache.command = false;
          });
          self.utils.keyboard.isShift(e, function() {
            cache.shift = true;
          }, function() {
            cache.shift = false;
          });
          self.utils.keyboard.isModifier(e, function(modifier) {
            if (cache.command) {
              self.events.commands[modifier](e);
            }
          });

          if (cache.shift) {
            self.utils.keyboard.isArrow(e, function() {
              setTimeout(function() {
                var txt = self.utils.selection.getText();
                if (txt !== '') {
                  self.bubble.show();
                } else {
                  self.bubble.clear();
                }
              }, 100);
            });
          } else {
            self.utils.keyboard.isArrow(e, function() {
              self.bubble.clear();
            });
          }

          if (e.which === 13) {
            self.events.enterKey();
          }
          if (e.which === 27) {
            self.bubble.clear();
          }
          if (e.which === 86) {
            this.events.paste(e);
          }
        },
        keyup: function(e) {
          self.utils.keyboard.isCommand(e, function() {
            cache.command = false;
          }, function() {
            cache.command = true;
          });
          self.preserveElementFocus();
          self.removePlaceholder();

          /*
           * This breaks the undo when the whole text is deleted but so far
           * it is the only way that I fould to solve the more serious bug
           * that the editor was losing the p elements after deleting the whole text
           */
          if (/^\s*$/.test($(this).text())) {
            $(this).empty();
            self.utils.html.addTag($(this), 'p', true, true);
          }
        },
        focus: function(e) {
          cache.command = false;
          cache.shift = false;
        },
        mouseClick: function(e) {
          var elem = this;
          cache.isSelecting = true;
          if (e.button === 2) {
            setTimeout(function() {
              self.bubble.show();
            }, 50);
            e.preventDefault();
            return;
          }
          if (self.bubble.isVisible()) {
            var bubbleTag = self.bubble.element,
              bubbleX = bubbleTag.offset().left,
              bubbleY = bubbleTag.offset().top,
              bubbleWidth = bubbleTag.width(),
              bubbleHeight = bubbleTag.height();
            if (mouseX > bubbleX && mouseX < bubbleX + bubbleWidth &&
              mouseY > bubbleY && mouseY < bubbleY + bubbleHeight) {
              return;
            }
          }
        },
        mouseUp: function(e) {
          e.preventDefault();
          cache.isSelecting = false;
          setTimeout(function() {
            var s = self.utils.selection.save();
            if (s.collapsed) {
              self.bubble.clear();
            } else {
              self.bubble.show();
            }
          }, 50);
        },
        mouseMove: function(e) {
          mouseX = e.pageX;
          mouseY = e.pageY;
        },
        blur: function(e) {
          self.setPlaceholder({
            focus: false
          });
        }
      },
      events: {
        commands: {
          bold: function(e) {
            e.preventDefault();
            d.execCommand('bold', false);
            self.bubble.update();
          },
          italic: function(e) {
            e.preventDefault();
            d.execCommand('italic', false);
            self.bubble.update();
          },
          underline: function(e) {
            e.preventDefault();
            d.execCommand('underline', false);
            self.bubble.update();
          },
          anchor: function(e) {
            e.preventDefault();
            var s = self.utils.selection.save();
            self.bubble.showLinkInput(s);
          },
          createLink: function(e, s) {
            self.utils.selection.restore(s);
            d.execCommand('createLink', false, e.url);
            self.bubble.update();
          },
          removeLink: function(e, s) {
            var el = $(self.utils.selection.getContainer(s)).closest('a');
            el.contents().first().unwrap();
          },
          h1: function(e) {
            e.preventDefault();
            if ($(window.getSelection().anchorNode.parentNode).is('h1')) {
              d.execCommand('formatBlock', false, '<p>');
            } else {
              d.execCommand('formatBlock', false, '<h1>');
            }
            self.bubble.update();
          },
          h2: function(e) {
            e.preventDefault();
            if ($(window.getSelection().anchorNode.parentNode).is('h2')) {
              d.execCommand('formatBlock', false, '<p>');
            } else {
              d.execCommand('formatBlock', false, '<h2>');
            }
            self.bubble.update();
          },
          ul: function(e) {
            e.preventDefault();
            d.execCommand('insertUnorderedList', false);
            self.bubble.update();
          },
          ol: function(e) {
            e.preventDefault();
            d.execCommand('insertOrderedList', false);
            self.bubble.update();
          },
          undo: function(e) {
            e.preventDefault();
            d.execCommand('undo', false);
          }
        },
        enterKey: function(e) {
          if (self.element.attr('editor-mode') === 'inline') {
            e.preventDefault();
            return;
          }
        },
        paste: function(e) {
          setTimeout(function() {
            self.element.find('*').each(function() {
              var current = $(this);
              $.each(this.attributes, function() {
                if (this.name !== 'class' || !current.hasClass('placeholder')) {
                  current.removeAttr(this.name);
                }
              });
            });
          }, 100);
        }
      }
    });
    self.init();
  };

  var Utils = function() {
    var isMac, self;
    self = this;
    isMac = w.navigator.platform == 'MacIntel';
    $.extend(this, {
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
            callback(cmd);
          }
        },
        isEnter: function(e, callback) {
          if (e.which === 13) {
            callback();
          }
        },
        isArrow: function(e, callback) {
          if (e.which >= 37 || e.which <= 40) {
            callback();
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
            this.cursor.set(elem, 0, cache.focusedElement);
          }
          return newElement;
        },
        decode: function(str) {
          return $('<div/>').html(str).text();
        }
      },
      cursor: {
        set: function(editor, pos, elem) {
          var range;
          if (d.createRange) {
            range = d.createRange();
            var selection = w.getSelection(),
              lastChild = editor.children().last(),
              length = lastChild.html().length - 1,
              toModify = elem ? elem[0] : lastChild[0],
              theLength = typeof pos !== 'undefined' ? pos : length;
            range.setStart(toModify, theLength);
            range.collapse(true);
            selection.removeAllRanges();
            selection.addRange(range);
          } else {
            range = d.body.createTextRange();
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
        },
        getText: function() {
          var txt = '';
          if (w.getSelection) {
            txt = w.getSelection().toString();
          } else if (d.getSelection) {
            txt = d.getSelection().toString();
          } else if (d.selection) {
            txt = d.selection.createRange().text;
          }
          return txt;
        },
        clear: function() {
          if (window.getSelection) {
            if (window.getSelection().empty) { // Chrome
              window.getSelection().empty();
            } else if (window.getSelection().removeAllRanges) { // Firefox
              window.getSelection().removeAllRanges();
            }
          } else if (document.selection) { // IE?
            document.selection.empty();
          }
        },
        getContainer: function(sel) {
          if (w.getSelection && sel && sel.commonAncestorContainer) {
            return sel.commonAncestorContainer;
          } else if (d.selection && sel && sel.parentElement) {
            return sel.parentElement();
          }
          return null;
        }
      },
      validation: {
        isUrl: function(url) {
          return (/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/).test(url);
        }
      }
    });
  };

  var notebookBubble = function(editor) {
    var self = this;
    $.extend(self, {
      /*
       * This is called to position the bubble above the selection.
       */
      isVisible: function() {
        return self.element.is(':visible');
      },
      updatePos: function() {
        var sel = w.getSelection(),
          range = sel.getRangeAt(0),
          boundary = range.getBoundingClientRect(),
          bubbleWidth = self.element.width(),
          bubbleHeight = self.element.height(),
          offset = self.notebook.element.offset().left,
          pos = {
            x: (boundary.left + boundary.width / 2) - bubbleWidth / 2,
            y: boundary.top - bubbleHeight - 8 + $(document).scrollTop()
          };
        transform.translate(self.element, pos.x, pos.y);
      },
      /*
       * Updates the bubble to set the active formats for the current selection.
       */
      updateState: function() {
        self.element.find('button').removeClass('active');
        var sel = w.getSelection(),
          formats = [];
        self.checkForFormatting(sel.focusNode, formats);
        var formatDict = {
          'b': 'bold',
          'i': 'italic',
          'u': 'underline',
          'h1': 'h1',
          'h2': 'h2',
          'a': 'anchor',
          'ul': 'ul',
          'ol': 'ol'
        };
        for (var i = 0; i < formats.length; i++) {
          var format = formats[i];
          self.element.find('button.' + formatDict[format]).addClass('active');
        }
      },
      /*
       * Recursively navigates upwards in the DOM to find all the format
       * tags enclosing the selection.
       */
      checkForFormatting: function(currentNode, formats) {
        var validFormats = ['b', 'i', 'u', 'h1', 'h2', 'ol', 'ul', 'li', 'a'];
        if (currentNode.nodeName === '#text' ||
          validFormats.indexOf(currentNode.nodeName.toLowerCase()) != -1) {
          if (currentNode.nodeName != '#text') {
            formats.push(currentNode.nodeName.toLowerCase());
          }
          self.checkForFormatting(currentNode.parentNode, formats);
        }
      },
      buildMenu: function() {
        var ul = self.notebook.utils.html.addTag(self.element, 'ul', false, false);
        for (var cmd in self.notebook.options.modifiers) {
          var li = self.notebook.utils.html.addTag(ul, 'li', false, false);
          var btn = self.notebook.utils.html.addTag(li, 'button', false, false);
          btn.attr('editor-command', self.notebook.options.modifiers[cmd]);
          btn.addClass(self.notebook.options.modifiers[cmd]);
        }
        self.element.find('button').click(function(e) {
          e.preventDefault();
          var cmd = $(this).attr('editor-command');
          self.notebook.events.commands[cmd](e);
        });
        var linkArea = self.notebook.utils.html.addTag(self.element, 'div', false, false);
        linkArea.addClass('link-area');
        var linkInput = self.notebook.utils.html.addTag(linkArea, 'input', false, false);
        linkInput.attr({
          type: 'text'
        });
        var closeBtn = self.notebook.utils.html.addTag(linkArea, 'button', false, false);
        closeBtn.click(function(e) {
          e.preventDefault();
          $(this).closest('.link-area').hide();
          self.element.find('ul').show();
        });
      },
      init: function(editor) {
        self.notebook = editor;

        self.element = self.notebook.utils.html.addTag(self.notebook.element.parent(), 'div', false, false);
        self.element.addClass('jquery-notebook bubble');
        self.buildMenu();
      },
      show: function() {
        self.element.show();
        self.updateState();
        self.element.toggleClass('jump');
        self.updatePos();
        self.element.addClass('active');
      },
      update: function() {
        self.updateState();
      },
      clear: function() {
        if (!self.element.hasClass('active')) return;
        self.element.removeClass('active');
        self.hideLinkInput();
        self.showButtons();
        setTimeout(function() {
          if (self.element.hasClass('active')) return;
          self.element.hide();
        }, 500);
      },
      hideButtons: function() {
        self.element.find('ul').hide();
      },
      showButtons: function() {
        self.element.find('ul').show();
      },
      showLinkInput: function(selection) {
        self.hideButtons();
        var elem, hasLink;
        elem = self.element.find('input[type=text]');
        hasLink = elem.closest('.jquery-notebook').find('button.anchor').hasClass('active');
        elem.unbind('keydown');
        elem.keydown(function(e) {
          var el = $(this);
          self.notebook.utils.keyboard.isEnter(e, function() {
            e.preventDefault();
            var url = el.val();
            if (self.notebook.utils.validation.isUrl(url)) {
              e.url = url;
              self.notebook.events.commands.createLink(e, selection);
              self.clear();
            } else if (url === '' && hasLink) {
              self.notebook.events.commands.removeLink(e, selection);
              self.clear();
            }
          });
        });
        elem.bind('paste', function(e) {
          var elem = $(this);
          setTimeout(function() {
            var text = elem.val();
            if (/http:\/\/https?:\/\//.test(text)) {
              text = text.substring(7);
              elem.val(text);
            }
          }, 1);
        });
        var linkText = 'http://';
        if (hasLink) {
          var anchor = $(self.notebook.utils.selection.getContainer(selection)).closest('a');
          linkText = anchor.prop('href') || linkText;
        }
        self.notebook.element.parent().find('.link-area').show();
        elem.val(linkText).focus();
      },
      hideLinkInput: function() {
        self.element.find('.link-area').hide();
      }
    });

    self.init(editor);
  };

  $.fn.notebook = function(options) {
    options = $.extend({}, $.fn.notebook.defaults, options);
    /*var self = this;
    if (this.prop("tagName") == 'TEXTAREA') {
      self.hide();
      var textarea = self;
      self = $('<div />', {
        html: utils.html.decode(textarea.html())
      });
      self.insertAfter(textarea);
    }
    actions.prepare(self, options);
    actions.bindEvents(self);*/
    return this.each(function() {
      new Notebook(this, options);
    });
  };

  $.fn.notebook.defaults = {
    autoFocus: false,
    placeholder: 'Your text here...',
    mode: 'multiline',
    modifiers: ['bold', 'italic', 'underline', 'h1', 'h2', 'ol', 'ul', 'anchor']
  };

})(jQuery, document, window);