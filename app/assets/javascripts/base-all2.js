/*
---
name: Slick.Parser
description: Standalone CSS3 Selector parser
provides: Slick.Parser
...
*/

(function(){

var parsed,
	separatorIndex,
	combinatorIndex,
	reversed,
	cache = {},
	reverseCache = {},
	reUnescape = /\\/g;

var parse = function(expression, isReversed){
	if (expression == null) return null;
	if (expression.Slick === true) return expression;
	expression = ('' + expression).replace(/^\s+|\s+$/g, '');
	reversed = !!isReversed;
	var currentCache = (reversed) ? reverseCache : cache;
	if (currentCache[expression]) return currentCache[expression];
	parsed = {Slick: true, expressions: [], raw: expression, reverse: function(){
		return parse(this.raw, true);
	}};
	separatorIndex = -1;
	while (expression != (expression = expression.replace(regexp, parser)));
	parsed.length = parsed.expressions.length;
	return currentCache[expression] = (reversed) ? reverse(parsed) : parsed;
};

var reverseCombinator = function(combinator){
	if (combinator === '!') return ' ';
	else if (combinator === ' ') return '!';
	else if ((/^!/).test(combinator)) return combinator.replace(/^!/, '');
	else return '!' + combinator;
};

var reverse = function(expression){
	var expressions = expression.expressions;
	for (var i = 0; i < expressions.length; i++){
		var exp = expressions[i];
		var last = {parts: [], tag: '*', combinator: reverseCombinator(exp[0].combinator)};

		for (var j = 0; j < exp.length; j++){
			var cexp = exp[j];
			if (!cexp.reverseCombinator) cexp.reverseCombinator = ' ';
			cexp.combinator = cexp.reverseCombinator;
			delete cexp.reverseCombinator;
		}

		exp.reverse().push(last);
	}
	return expression;
};

var escapeRegExp = function(string){// Credit: XRegExp 0.6.1 (c) 2007-2008 Steven Levithan <http://stevenlevithan.com/regex/xregexp/> MIT License
	return string.replace(/[-[\]{}()*+?.\\^$|,#\s]/g, "\\$&");
};

var regexp = new RegExp(
/*
#!/usr/bin/env ruby
puts "\t\t" + DATA.read.gsub(/\(\?x\)|\s+#.*$|\s+|\\$|\\n/,'')
__END__
	"(?x)^(?:\
	  \\s* ( , ) \\s*               # Separator          \n\
	| \\s* ( <combinator>+ ) \\s*   # Combinator         \n\
	|      ( \\s+ )                 # CombinatorChildren \n\
	|      ( <unicode>+ | \\* )     # Tag                \n\
	| \\#  ( <unicode>+       )     # ID                 \n\
	| \\.  ( <unicode>+       )     # ClassName          \n\
	|                               # Attribute          \n\
	\\[  \
		\\s* (<unicode1>+)  (?:  \
			\\s* ([*^$!~|]?=)  (?:  \
				\\s* (?:\
					([\"']?)(.*?)\\9 \
				)\
			)  \
		)?  \\s*  \
	\\](?!\\]) \n\
	|   :+ ( <unicode>+ )(?:\
	\\( (?:\
		(?:([\"'])([^\\12]*)\\12)|((?:\\([^)]+\\)|[^()]*)+)\
	) \\)\
	)?\
	)"
*/
	"^(?:\\s*(,)\\s*|\\s*(<combinator>+)\\s*|(\\s+)|(<unicode>+|\\*)|\\#(<unicode>+)|\\.(<unicode>+)|\\[\\s*(<unicode1>+)(?:\\s*([*^$!~|]?=)(?:\\s*(?:([\"']?)(.*?)\\9)))?\\s*\\](?!\\])|:+(<unicode>+)(?:\\((?:(?:([\"'])([^\\12]*)\\12)|((?:\\([^)]+\\)|[^()]*)+))\\))?)"
	.replace(/<combinator>/, '[' + escapeRegExp(">+~`!@$%^&={}\\;</") + ']')
	.replace(/<unicode>/g, '(?:[\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
	.replace(/<unicode1>/g, '(?:[:\\w\\u00a1-\\uFFFF-]|\\\\[^\\s0-9a-f])')
);

function parser(
	rawMatch,

	separator,
	combinator,
	combinatorChildren,

	tagName,
	id,
	className,

	attributeKey,
	attributeOperator,
	attributeQuote,
	attributeValue,

	pseudoClass,
	pseudoQuote,
	pseudoClassQuotedValue,
	pseudoClassValue
){
	if (separator || separatorIndex === -1){
		parsed.expressions[++separatorIndex] = [];
		combinatorIndex = -1;
		if (separator) return '';
	}

	if (combinator || combinatorChildren || combinatorIndex === -1){
		combinator = combinator || ' ';
		var currentSeparator = parsed.expressions[separatorIndex];
		if (reversed && currentSeparator[combinatorIndex])
			currentSeparator[combinatorIndex].reverseCombinator = reverseCombinator(combinator);
		currentSeparator[++combinatorIndex] = {combinator: combinator, tag: '*'};
	}

	var currentParsed = parsed.expressions[separatorIndex][combinatorIndex];

	if (tagName){
		currentParsed.tag = tagName.replace(reUnescape, '');

	} else if (id){
		currentParsed.id = id.replace(reUnescape, '');

	} else if (className){
		className = className.replace(reUnescape, '');

		if (!currentParsed.classList) currentParsed.classList = [];
		if (!currentParsed.classes) currentParsed.classes = [];
		currentParsed.classList.push(className);
		currentParsed.classes.push({
			value: className,
			regexp: new RegExp('(^|\\s)' + escapeRegExp(className) + '(\\s|$)')
		});

	} else if (pseudoClass){
		pseudoClassValue = pseudoClassValue || pseudoClassQuotedValue;
		pseudoClassValue = pseudoClassValue ? pseudoClassValue.replace(reUnescape, '') : null;

		if (!currentParsed.pseudos) currentParsed.pseudos = [];
		currentParsed.pseudos.push({
			key: pseudoClass.replace(reUnescape, ''),
			value: pseudoClassValue
		});

	} else if (attributeKey){
		attributeKey = attributeKey.replace(reUnescape, '');
		attributeValue = (attributeValue || '').replace(reUnescape, '');

		var test, regexp;

		switch (attributeOperator){
			case '^=' : regexp = new RegExp(       '^'+ escapeRegExp(attributeValue)            ); break;
			case '$=' : regexp = new RegExp(            escapeRegExp(attributeValue) +'$'       ); break;
			case '~=' : regexp = new RegExp( '(^|\\s)'+ escapeRegExp(attributeValue) +'(\\s|$)' ); break;
			case '|=' : regexp = new RegExp(       '^'+ escapeRegExp(attributeValue) +'(-|$)'   ); break;
			case  '=' : test = function(value){
				return attributeValue == value;
			}; break;
			case '*=' : test = function(value){
				return value && value.indexOf(attributeValue) > -1;
			}; break;
			case '!=' : test = function(value){
				return attributeValue != value;
			}; break;
			default   : test = function(value){
				return !!value;
			};
		}

		if (attributeValue == '' && (/^[*$^]=$/).test(attributeOperator)) test = function(){
			return false;
		};

		if (!test) test = function(value){
			return value && regexp.test(value);
		};

		if (!currentParsed.attributes) currentParsed.attributes = [];
		currentParsed.attributes.push({
			key: attributeKey,
			operator: attributeOperator,
			value: attributeValue,
			test: test
		});

	}

	return '';
};

// Slick NS

var Slick = (this.Slick || {});

Slick.parse = function(expression){
	return parse(expression);
};

Slick.escapeRegExp = escapeRegExp;

if (!this.Slick) this.Slick = Slick;

}).apply(/*<CommonJS>*/(typeof exports != 'undefined') ? exports : /*</CommonJS>*/this);

/*!
 * Sizzle CSS Selector Engine - v1.0
 *  Copyright 2009, The Dojo Foundation
 *  Released under the MIT, BSD, and GPL Licenses.
 *  More information: http://sizzlejs.com/
 */
(function(){

var chunker = /((?:\((?:\([^()]+\)|[^()]+)+\)|\[(?:\[[^\[\]]*\]|['"][^'"]*['"]|[^\[\]'"]+)+\]|\\.|[^ >+~,(\[\\]+)+|[>+~])(\s*,\s*)?((?:.|\r|\n)*)/g,
	done = 0,
	toString = Object.prototype.toString,
	hasDuplicate = false,
	baseHasDuplicate = true;

// Here we check if the JavaScript engine is using some sort of
// optimization where it does not always call our comparision
// function. If that is the case, discard the hasDuplicate value.
//   Thus far that includes Google Chrome.
[0, 0].sort(function() {
	baseHasDuplicate = false;
	return 0;
});

var Sizzle = function( selector, context, results, seed ) {
	results = results || [];
	context = context || document;

	var origContext = context;

	if ( context.nodeType !== 1 && context.nodeType !== 9 ) {
		return [];
	}
	
	if ( !selector || typeof selector !== "string" ) {
		return results;
	}

	var m, set, checkSet, extra, ret, cur, pop, i,
		prune = true,
		contextXML = Sizzle.isXML( context ),
		parts = [],
		soFar = selector;
	
	// Reset the position of the chunker regexp (start from head)
	do {
		chunker.exec( "" );
		m = chunker.exec( soFar );

		if ( m ) {
			soFar = m[3];
		
			parts.push( m[1] );
		
			if ( m[2] ) {
				extra = m[3];
				break;
			}
		}
	} while ( m );

	if ( parts.length > 1 && origPOS.exec( selector ) ) {

		if ( parts.length === 2 && Expr.relative[ parts[0] ] ) {
			set = posProcess( parts[0] + parts[1], context );

		} else {
			set = Expr.relative[ parts[0] ] ?
				[ context ] :
				Sizzle( parts.shift(), context );

			while ( parts.length ) {
				selector = parts.shift();

				if ( Expr.relative[ selector ] ) {
					selector += parts.shift();
				}
				
				set = posProcess( selector, set );
			}
		}

	} else {
		// Take a shortcut and set the context if the root selector is an ID
		// (but not if it'll be faster if the inner selector is an ID)
		if ( !seed && parts.length > 1 && context.nodeType === 9 && !contextXML &&
				Expr.match.ID.test(parts[0]) && !Expr.match.ID.test(parts[parts.length - 1]) ) {

			ret = Sizzle.find( parts.shift(), context, contextXML );
			context = ret.expr ?
				Sizzle.filter( ret.expr, ret.set )[0] :
				ret.set[0];
		}

		if ( context ) {
			ret = seed ?
				{ expr: parts.pop(), set: makeArray(seed) } :
				Sizzle.find( parts.pop(), parts.length === 1 && (parts[0] === "~" || parts[0] === "+") && context.parentNode ? context.parentNode : context, contextXML );

			set = ret.expr ?
				Sizzle.filter( ret.expr, ret.set ) :
				ret.set;

			if ( parts.length > 0 ) {
				checkSet = makeArray( set );

			} else {
				prune = false;
			}

			while ( parts.length ) {
				cur = parts.pop();
				pop = cur;

				if ( !Expr.relative[ cur ] ) {
					cur = "";
				} else {
					pop = parts.pop();
				}

				if ( pop == null ) {
					pop = context;
				}

				Expr.relative[ cur ]( checkSet, pop, contextXML );
			}

		} else {
			checkSet = parts = [];
		}
	}

	if ( !checkSet ) {
		checkSet = set;
	}

	if ( !checkSet ) {
		Sizzle.error( cur || selector );
	}

	if ( toString.call(checkSet) === "[object Array]" ) {
		if ( !prune ) {
			results.push.apply( results, checkSet );

		} else if ( context && context.nodeType === 1 ) {
			for ( i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && (checkSet[i] === true || checkSet[i].nodeType === 1 && Sizzle.contains(context, checkSet[i])) ) {
					results.push( set[i] );
				}
			}

		} else {
			for ( i = 0; checkSet[i] != null; i++ ) {
				if ( checkSet[i] && checkSet[i].nodeType === 1 ) {
					results.push( set[i] );
				}
			}
		}

	} else {
		makeArray( checkSet, results );
	}

	if ( extra ) {
		Sizzle( extra, origContext, results, seed );
		Sizzle.uniqueSort( results );
	}

	return results;
};

Sizzle.uniqueSort = function( results ) {
	if ( sortOrder ) {
		hasDuplicate = baseHasDuplicate;
		results.sort( sortOrder );

		if ( hasDuplicate ) {
			for ( var i = 1; i < results.length; i++ ) {
				if ( results[i] === results[ i - 1 ] ) {
					results.splice( i--, 1 );
				}
			}
		}
	}

	return results;
};

Sizzle.matches = function( expr, set ) {
	return Sizzle( expr, null, null, set );
};

Sizzle.matchesSelector = function( node, expr ) {
	return Sizzle( expr, null, null, [node] ).length > 0;
};

Sizzle.find = function( expr, context, isXML ) {
	var set;

	if ( !expr ) {
		return [];
	}

	for ( var i = 0, l = Expr.order.length; i < l; i++ ) {
		var match,
			type = Expr.order[i];
		
		if ( (match = Expr.leftMatch[ type ].exec( expr )) ) {
			var left = match[1];
			match.splice( 1, 1 );

			if ( left.substr( left.length - 1 ) !== "\\" ) {
				match[1] = (match[1] || "").replace(/\\/g, "");
				set = Expr.find[ type ]( match, context, isXML );

				if ( set != null ) {
					expr = expr.replace( Expr.match[ type ], "" );
					break;
				}
			}
		}
	}

	if ( !set ) {
		set = context.getElementsByTagName( "*" );
	}

	return { set: set, expr: expr };
};

Sizzle.filter = function( expr, set, inplace, not ) {
	var match, anyFound,
		old = expr,
		result = [],
		curLoop = set,
		isXMLFilter = set && set[0] && Sizzle.isXML( set[0] );

	while ( expr && set.length ) {
		for ( var type in Expr.filter ) {
			if ( (match = Expr.leftMatch[ type ].exec( expr )) != null && match[2] ) {
				var found, item,
					filter = Expr.filter[ type ],
					left = match[1];

				anyFound = false;

				match.splice(1,1);

				if ( left.substr( left.length - 1 ) === "\\" ) {
					continue;
				}

				if ( curLoop === result ) {
					result = [];
				}

				if ( Expr.preFilter[ type ] ) {
					match = Expr.preFilter[ type ]( match, curLoop, inplace, result, not, isXMLFilter );

					if ( !match ) {
						anyFound = found = true;

					} else if ( match === true ) {
						continue;
					}
				}

				if ( match ) {
					for ( var i = 0; (item = curLoop[i]) != null; i++ ) {
						if ( item ) {
							found = filter( item, match, i, curLoop );
							var pass = not ^ !!found;

							if ( inplace && found != null ) {
								if ( pass ) {
									anyFound = true;

								} else {
									curLoop[i] = false;
								}

							} else if ( pass ) {
								result.push( item );
								anyFound = true;
							}
						}
					}
				}

				if ( found !== undefined ) {
					if ( !inplace ) {
						curLoop = result;
					}

					expr = expr.replace( Expr.match[ type ], "" );

					if ( !anyFound ) {
						return [];
					}

					break;
				}
			}
		}

		// Improper expression
		if ( expr === old ) {
			if ( anyFound == null ) {
				Sizzle.error( expr );

			} else {
				break;
			}
		}

		old = expr;
	}

	return curLoop;
};

Sizzle.error = function( msg ) {
	throw "Syntax error, unrecognized expression: " + msg;
};

var Expr = Sizzle.selectors = {
	order: [ "ID", "NAME", "TAG" ],

	match: {
		ID: /#((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
		CLASS: /\.((?:[\w\u00c0-\uFFFF\-]|\\.)+)/,
		NAME: /\[name=['"]*((?:[\w\u00c0-\uFFFF\-]|\\.)+)['"]*\]/,
		ATTR: /\[\s*((?:[\w\u00c0-\uFFFF\-]|\\.)+)\s*(?:(\S?=)\s*(['"]*)(.*?)\3|)\s*\]/,
		TAG: /^((?:[\w\u00c0-\uFFFF\*\-]|\\.)+)/,
		CHILD: /:(only|nth|last|first)-child(?:\(\s*(even|odd|(?:[+\-]?\d+|(?:[+\-]?\d*)?n\s*(?:[+\-]\s*\d+)?))\s*\))?/,
		POS: /:(nth|eq|gt|lt|first|last|even|odd)(?:\((\d*)\))?(?=[^\-]|$)/,
		PSEUDO: /:((?:[\w\u00c0-\uFFFF\-]|\\.)+)(?:\((['"]?)((?:\([^\)]+\)|[^\(\)]*)+)\2\))?/
	},

	leftMatch: {},

	attrMap: {
		"class": "className",
		"for": "htmlFor"
	},

	attrHandle: {
		href: function( elem ) {
			return elem.getAttribute( "href" );
		}
	},

	relative: {
		"+": function(checkSet, part){
			var isPartStr = typeof part === "string",
				isTag = isPartStr && !/\W/.test( part ),
				isPartStrNotTag = isPartStr && !isTag;

			if ( isTag ) {
				part = part.toLowerCase();
			}

			for ( var i = 0, l = checkSet.length, elem; i < l; i++ ) {
				if ( (elem = checkSet[i]) ) {
					while ( (elem = elem.previousSibling) && elem.nodeType !== 1 ) {}

					checkSet[i] = isPartStrNotTag || elem && elem.nodeName.toLowerCase() === part ?
						elem || false :
						elem === part;
				}
			}

			if ( isPartStrNotTag ) {
				Sizzle.filter( part, checkSet, true );
			}
		},

		">": function( checkSet, part ) {
			var elem,
				isPartStr = typeof part === "string",
				i = 0,
				l = checkSet.length;

			if ( isPartStr && !/\W/.test( part ) ) {
				part = part.toLowerCase();

				for ( ; i < l; i++ ) {
					elem = checkSet[i];

					if ( elem ) {
						var parent = elem.parentNode;
						checkSet[i] = parent.nodeName.toLowerCase() === part ? parent : false;
					}
				}

			} else {
				for ( ; i < l; i++ ) {
					elem = checkSet[i];

					if ( elem ) {
						checkSet[i] = isPartStr ?
							elem.parentNode :
							elem.parentNode === part;
					}
				}

				if ( isPartStr ) {
					Sizzle.filter( part, checkSet, true );
				}
			}
		},

		"": function(checkSet, part, isXML){
			var nodeCheck,
				doneName = done++,
				checkFn = dirCheck;

			if ( typeof part === "string" && !/\W/.test(part) ) {
				part = part.toLowerCase();
				nodeCheck = part;
				checkFn = dirNodeCheck;
			}

			checkFn( "parentNode", part, doneName, checkSet, nodeCheck, isXML );
		},

		"~": function( checkSet, part, isXML ) {
			var nodeCheck,
				doneName = done++,
				checkFn = dirCheck;

			if ( typeof part === "string" && !/\W/.test( part ) ) {
				part = part.toLowerCase();
				nodeCheck = part;
				checkFn = dirNodeCheck;
			}

			checkFn( "previousSibling", part, doneName, checkSet, nodeCheck, isXML );
		}
	},

	find: {
		ID: function( match, context, isXML ) {
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);
				// Check parentNode to catch when Blackberry 4.6 returns
				// nodes that are no longer in the document #6963
				return m && m.parentNode ? [m] : [];
			}
		},

		NAME: function( match, context ) {
			if ( typeof context.getElementsByName !== "undefined" ) {
				var ret = [],
					results = context.getElementsByName( match[1] );

				for ( var i = 0, l = results.length; i < l; i++ ) {
					if ( results[i].getAttribute("name") === match[1] ) {
						ret.push( results[i] );
					}
				}

				return ret.length === 0 ? null : ret;
			}
		},

		TAG: function( match, context ) {
			return context.getElementsByTagName( match[1] );
		}
	},
	preFilter: {
		CLASS: function( match, curLoop, inplace, result, not, isXML ) {
			match = " " + match[1].replace(/\\/g, "") + " ";

			if ( isXML ) {
				return match;
			}

			for ( var i = 0, elem; (elem = curLoop[i]) != null; i++ ) {
				if ( elem ) {
					if ( not ^ (elem.className && (" " + elem.className + " ").replace(/[\t\n\r]/g, " ").indexOf(match) >= 0) ) {
						if ( !inplace ) {
							result.push( elem );
						}

					} else if ( inplace ) {
						curLoop[i] = false;
					}
				}
			}

			return false;
		},

		ID: function( match ) {
			return match[1].replace(/\\/g, "");
		},

		TAG: function( match, curLoop ) {
			return match[1].toLowerCase();
		},

		CHILD: function( match ) {
			if ( match[1] === "nth" ) {
				if ( !match[2] ) {
					Sizzle.error( match[0] );
				}

				match[2] = match[2].replace(/^\+|\s*/g, '');

				// parse equations like 'even', 'odd', '5', '2n', '3n+2', '4n-1', '-n+6'
				var test = /(-?)(\d*)(?:n([+\-]?\d*))?/.exec(
					match[2] === "even" && "2n" || match[2] === "odd" && "2n+1" ||
					!/\D/.test( match[2] ) && "0n+" + match[2] || match[2]);

				// calculate the numbers (first)n+(last) including if they are negative
				match[2] = (test[1] + (test[2] || 1)) - 0;
				match[3] = test[3] - 0;
			}
			else if ( match[2] ) {
				Sizzle.error( match[0] );
			}

			// TODO: Move to normal caching system
			match[0] = done++;

			return match;
		},

		ATTR: function( match, curLoop, inplace, result, not, isXML ) {
			var name = match[1].replace(/\\/g, "");
			
			if ( !isXML && Expr.attrMap[name] ) {
				match[1] = Expr.attrMap[name];
			}

			if ( match[2] === "~=" ) {
				match[4] = " " + match[4] + " ";
			}

			return match;
		},

		PSEUDO: function( match, curLoop, inplace, result, not ) {
			if ( match[1] === "not" ) {
				// If we're dealing with a complex expression, or a simple one
				if ( ( chunker.exec(match[3]) || "" ).length > 1 || /^\w/.test(match[3]) ) {
					match[3] = Sizzle(match[3], null, null, curLoop);

				} else {
					var ret = Sizzle.filter(match[3], curLoop, inplace, true ^ not);

					if ( !inplace ) {
						result.push.apply( result, ret );
					}

					return false;
				}

			} else if ( Expr.match.POS.test( match[0] ) || Expr.match.CHILD.test( match[0] ) ) {
				return true;
			}
			
			return match;
		},

		POS: function( match ) {
			match.unshift( true );

			return match;
		}
	},
	
	filters: {
		enabled: function( elem ) {
			return elem.disabled === false && elem.type !== "hidden";
		},

		disabled: function( elem ) {
			return elem.disabled === true;
		},

		checked: function( elem ) {
			return elem.checked === true;
		},
		
		selected: function( elem ) {
			// Accessing this property makes selected-by-default
			// options in Safari work properly
			elem.parentNode.selectedIndex;
			
			return elem.selected === true;
		},

		parent: function( elem ) {
			return !!elem.firstChild;
		},

		empty: function( elem ) {
			return !elem.firstChild;
		},

		has: function( elem, i, match ) {
			return !!Sizzle( match[3], elem ).length;
		},

		header: function( elem ) {
			return (/h\d/i).test( elem.nodeName );
		},

		text: function( elem ) {
			return "text" === elem.type;
		},
		radio: function( elem ) {
			return "radio" === elem.type;
		},

		checkbox: function( elem ) {
			return "checkbox" === elem.type;
		},

		file: function( elem ) {
			return "file" === elem.type;
		},
		password: function( elem ) {
			return "password" === elem.type;
		},

		submit: function( elem ) {
			return "submit" === elem.type;
		},

		image: function( elem ) {
			return "image" === elem.type;
		},

		reset: function( elem ) {
			return "reset" === elem.type;
		},

		button: function( elem ) {
			return "button" === elem.type || elem.nodeName.toLowerCase() === "button";
		},

		input: function( elem ) {
			return (/input|select|textarea|button/i).test( elem.nodeName );
		}
	},
	setFilters: {
		first: function( elem, i ) {
			return i === 0;
		},

		last: function( elem, i, match, array ) {
			return i === array.length - 1;
		},

		even: function( elem, i ) {
			return i % 2 === 0;
		},

		odd: function( elem, i ) {
			return i % 2 === 1;
		},

		lt: function( elem, i, match ) {
			return i < match[3] - 0;
		},

		gt: function( elem, i, match ) {
			return i > match[3] - 0;
		},

		nth: function( elem, i, match ) {
			return match[3] - 0 === i;
		},

		eq: function( elem, i, match ) {
			return match[3] - 0 === i;
		}
	},
	filter: {
		PSEUDO: function( elem, match, i, array ) {
			var name = match[1],
				filter = Expr.filters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );

			} else if ( name === "contains" ) {
				return (elem.textContent || elem.innerText || Sizzle.getText([ elem ]) || "").indexOf(match[3]) >= 0;

			} else if ( name === "not" ) {
				var not = match[3];

				for ( var j = 0, l = not.length; j < l; j++ ) {
					if ( not[j] === elem ) {
						return false;
					}
				}

				return true;

			} else {
				Sizzle.error( name );
			}
		},

		CHILD: function( elem, match ) {
			var type = match[1],
				node = elem;

			switch ( type ) {
				case "only":
				case "first":
					while ( (node = node.previousSibling) )	 {
						if ( node.nodeType === 1 ) { 
							return false; 
						}
					}

					if ( type === "first" ) { 
						return true; 
					}

					node = elem;

				case "last":
					while ( (node = node.nextSibling) )	 {
						if ( node.nodeType === 1 ) { 
							return false; 
						}
					}

					return true;

				case "nth":
					var first = match[2],
						last = match[3];

					if ( first === 1 && last === 0 ) {
						return true;
					}
					
					var doneName = match[0],
						parent = elem.parentNode;
	
					if ( parent && (parent.sizcache !== doneName || !elem.nodeIndex) ) {
						var count = 0;
						
						for ( node = parent.firstChild; node; node = node.nextSibling ) {
							if ( node.nodeType === 1 ) {
								node.nodeIndex = ++count;
							}
						} 

						parent.sizcache = doneName;
					}
					
					var diff = elem.nodeIndex - last;

					if ( first === 0 ) {
						return diff === 0;

					} else {
						return ( diff % first === 0 && diff / first >= 0 );
					}
			}
		},

		ID: function( elem, match ) {
			return elem.nodeType === 1 && elem.getAttribute("id") === match;
		},

		TAG: function( elem, match ) {
			return (match === "*" && elem.nodeType === 1) || elem.nodeName.toLowerCase() === match;
		},
		
		CLASS: function( elem, match ) {
			return (" " + (elem.className || elem.getAttribute("class")) + " ")
				.indexOf( match ) > -1;
		},

		ATTR: function( elem, match ) {
			var name = match[1],
				result = Expr.attrHandle[ name ] ?
					Expr.attrHandle[ name ]( elem ) :
					elem[ name ] != null ?
						elem[ name ] :
						elem.getAttribute( name ),
				value = result + "",
				type = match[2],
				check = match[4];

			return result == null ?
				type === "!=" :
				type === "=" ?
				value === check :
				type === "*=" ?
				value.indexOf(check) >= 0 :
				type === "~=" ?
				(" " + value + " ").indexOf(check) >= 0 :
				!check ?
				value && result !== false :
				type === "!=" ?
				value !== check :
				type === "^=" ?
				value.indexOf(check) === 0 :
				type === "$=" ?
				value.substr(value.length - check.length) === check :
				type === "|=" ?
				value === check || value.substr(0, check.length + 1) === check + "-" :
				false;
		},

		POS: function( elem, match, i, array ) {
			var name = match[2],
				filter = Expr.setFilters[ name ];

			if ( filter ) {
				return filter( elem, i, match, array );
			}
		}
	}
};

var origPOS = Expr.match.POS,
	fescape = function(all, num){
		return "\\" + (num - 0 + 1);
	};

for ( var type in Expr.match ) {
	Expr.match[ type ] = new RegExp( Expr.match[ type ].source + (/(?![^\[]*\])(?![^\(]*\))/.source) );
	Expr.leftMatch[ type ] = new RegExp( /(^(?:.|\r|\n)*?)/.source + Expr.match[ type ].source.replace(/\\(\d+)/g, fescape) );
}

var makeArray = function( array, results ) {
	array = Array.prototype.slice.call( array, 0 );

	if ( results ) {
		results.push.apply( results, array );
		return results;
	}
	
	return array;
};

// Perform a simple check to determine if the browser is capable of
// converting a NodeList to an array using builtin methods.
// Also verifies that the returned array holds DOM nodes
// (which is not the case in the Blackberry browser)
try {
	Array.prototype.slice.call( document.documentElement.childNodes, 0 )[0].nodeType;

// Provide a fallback method if it does not work
} catch( e ) {
	makeArray = function( array, results ) {
		var i = 0,
			ret = results || [];

		if ( toString.call(array) === "[object Array]" ) {
			Array.prototype.push.apply( ret, array );

		} else {
			if ( typeof array.length === "number" ) {
				for ( var l = array.length; i < l; i++ ) {
					ret.push( array[i] );
				}

			} else {
				for ( ; array[i]; i++ ) {
					ret.push( array[i] );
				}
			}
		}

		return ret;
	};
}

var sortOrder, siblingCheck;

if ( document.documentElement.compareDocumentPosition ) {
	sortOrder = function( a, b ) {
		if ( a === b ) {
			hasDuplicate = true;
			return 0;
		}

		if ( !a.compareDocumentPosition || !b.compareDocumentPosition ) {
			return a.compareDocumentPosition ? -1 : 1;
		}

		return a.compareDocumentPosition(b) & 4 ? -1 : 1;
	};

} else {
	sortOrder = function( a, b ) {
		var al, bl,
			ap = [],
			bp = [],
			aup = a.parentNode,
			bup = b.parentNode,
			cur = aup;

		// The nodes are identical, we can exit early
		if ( a === b ) {
			hasDuplicate = true;
			return 0;

		// If the nodes are siblings (or identical) we can do a quick check
		} else if ( aup === bup ) {
			return siblingCheck( a, b );

		// If no parents were found then the nodes are disconnected
		} else if ( !aup ) {
			return -1;

		} else if ( !bup ) {
			return 1;
		}

		// Otherwise they're somewhere else in the tree so we need
		// to build up a full list of the parentNodes for comparison
		while ( cur ) {
			ap.unshift( cur );
			cur = cur.parentNode;
		}

		cur = bup;

		while ( cur ) {
			bp.unshift( cur );
			cur = cur.parentNode;
		}

		al = ap.length;
		bl = bp.length;

		// Start walking down the tree looking for a discrepancy
		for ( var i = 0; i < al && i < bl; i++ ) {
			if ( ap[i] !== bp[i] ) {
				return siblingCheck( ap[i], bp[i] );
			}
		}

		// We ended someplace up the tree so do a sibling check
		return i === al ?
			siblingCheck( a, bp[i], -1 ) :
			siblingCheck( ap[i], b, 1 );
	};

	siblingCheck = function( a, b, ret ) {
		if ( a === b ) {
			return ret;
		}

		var cur = a.nextSibling;

		while ( cur ) {
			if ( cur === b ) {
				return -1;
			}

			cur = cur.nextSibling;
		}

		return 1;
	};
}

// Utility function for retreiving the text value of an array of DOM nodes
Sizzle.getText = function( elems ) {
	var ret = "", elem;

	for ( var i = 0; elems[i]; i++ ) {
		elem = elems[i];

		// Get the text from text nodes and CDATA nodes
		if ( elem.nodeType === 3 || elem.nodeType === 4 ) {
			ret += elem.nodeValue;

		// Traverse everything else, except comment nodes
		} else if ( elem.nodeType !== 8 ) {
			ret += Sizzle.getText( elem.childNodes );
		}
	}

	return ret;
};

// Check to see if the browser returns elements by name when
// querying by getElementById (and provide a workaround)
(function(){
	// We're going to inject a fake input element with a specified name
	var form = document.createElement("div"),
		id = "script" + (new Date()).getTime(),
		root = document.documentElement;

	form.innerHTML = "<a name='" + id + "'/>";

	// Inject it into the root element, check its status, and remove it quickly
	root.insertBefore( form, root.firstChild );

	// The workaround has to do additional checks after a getElementById
	// Which slows things down for other browsers (hence the branching)
	if ( document.getElementById( id ) ) {
		Expr.find.ID = function( match, context, isXML ) {
			if ( typeof context.getElementById !== "undefined" && !isXML ) {
				var m = context.getElementById(match[1]);

				return m ?
					m.id === match[1] || typeof m.getAttributeNode !== "undefined" && m.getAttributeNode("id").nodeValue === match[1] ?
						[m] :
						undefined :
					[];
			}
		};

		Expr.filter.ID = function( elem, match ) {
			var node = typeof elem.getAttributeNode !== "undefined" && elem.getAttributeNode("id");

			return elem.nodeType === 1 && node && node.nodeValue === match;
		};
	}

	root.removeChild( form );

	// release memory in IE
	root = form = null;
})();

(function(){
	// Check to see if the browser returns only elements
	// when doing getElementsByTagName("*")

	// Create a fake element
	var div = document.createElement("div");
	div.appendChild( document.createComment("") );

	// Make sure no comments are found
	if ( div.getElementsByTagName("*").length > 0 ) {
		Expr.find.TAG = function( match, context ) {
			var results = context.getElementsByTagName( match[1] );

			// Filter out possible comments
			if ( match[1] === "*" ) {
				var tmp = [];

				for ( var i = 0; results[i]; i++ ) {
					if ( results[i].nodeType === 1 ) {
						tmp.push( results[i] );
					}
				}

				results = tmp;
			}

			return results;
		};
	}

	// Check to see if an attribute returns normalized href attributes
	div.innerHTML = "<a href='#'></a>";

	if ( div.firstChild && typeof div.firstChild.getAttribute !== "undefined" &&
			div.firstChild.getAttribute("href") !== "#" ) {

		Expr.attrHandle.href = function( elem ) {
			return elem.getAttribute( "href", 2 );
		};
	}

	// release memory in IE
	div = null;
})();

if ( document.querySelectorAll ) {
	(function(){
		var oldSizzle = Sizzle,
			div = document.createElement("div"),
			id = "__sizzle__";

		div.innerHTML = "<p class='TEST'></p>";

		// Safari can't handle uppercase or unicode characters when
		// in quirks mode.
		if ( div.querySelectorAll && div.querySelectorAll(".TEST").length === 0 ) {
			return;
		}
	
		Sizzle = function( query, context, extra, seed ) {
			context = context || document;

			// Make sure that attribute selectors are quoted
			query = query.replace(/\=\s*([^'"\]]*)\s*\]/g, "='$1']");

			// Only use querySelectorAll on non-XML documents
			// (ID selectors don't work in non-HTML documents)
			if ( !seed && !Sizzle.isXML(context) ) {
				if ( context.nodeType === 9 ) {
					try {
						return makeArray( context.querySelectorAll(query), extra );
					} catch(qsaError) {}

				// qSA works strangely on Element-rooted queries
				// We can work around this by specifying an extra ID on the root
				// and working up from there (Thanks to Andrew Dupont for the technique)
				// IE 8 doesn't work on object elements
				} else if ( context.nodeType === 1 && context.nodeName.toLowerCase() !== "object" ) {
					var old = context.getAttribute( "id" ),
						nid = old || id,
						hasParent = context.parentNode,
						relativeHierarchySelector = /^\s*[+~]/.test( query );

					if ( !old ) {
						context.setAttribute( "id", nid );
					} else {
						nid = nid.replace( /'/g, "\\$&" );
					}
					if ( relativeHierarchySelector && hasParent ) {
						context = context.parentNode;
					}

					try {
						if ( !relativeHierarchySelector || hasParent ) {
							return makeArray( context.querySelectorAll( "[id='" + nid + "'] " + query ), extra );
						}

					} catch(pseudoError) {
					} finally {
						if ( !old ) {
							context.removeAttribute( "id" );
						}
					}
				}
			}
		
			return oldSizzle(query, context, extra, seed);
		};

		for ( var prop in oldSizzle ) {
			Sizzle[ prop ] = oldSizzle[ prop ];
		}

		// release memory in IE
		div = null;
	})();
}

(function(){
	var html = document.documentElement,
		matches = html.matchesSelector || html.mozMatchesSelector || html.webkitMatchesSelector || html.msMatchesSelector,
		pseudoWorks = false;

	try {
		// This should fail with an exception
		// Gecko does not error, returns false instead
		matches.call( document.documentElement, "[test!='']:sizzle" );
	
	} catch( pseudoError ) {
		pseudoWorks = true;
	}

	if ( matches ) {
		Sizzle.matchesSelector = function( node, expr ) {
			// Make sure that attribute selectors are quoted
			expr = expr.replace(/\=\s*([^'"\]]*)\s*\]/g, "='$1']");

			if ( !Sizzle.isXML( node ) ) {
				try { 
					if ( pseudoWorks || !Expr.match.PSEUDO.test( expr ) && !/!=/.test( expr ) ) {
						return matches.call( node, expr );
					}
				} catch(e) {}
			}

			return Sizzle(expr, null, null, [node]).length > 0;
		};
	}
})();

(function(){
	var div = document.createElement("div");

	div.innerHTML = "<div class='test e'></div><div class='test'></div>";

	// Opera can't find a second classname (in 9.6)
	// Also, make sure that getElementsByClassName actually exists
	if ( !div.getElementsByClassName || div.getElementsByClassName("e").length === 0 ) {
		return;
	}

	// Safari caches class attributes, doesn't catch changes (in 3.2)
	div.lastChild.className = "e";

	if ( div.getElementsByClassName("e").length === 1 ) {
		return;
	}
	
	Expr.order.splice(1, 0, "CLASS");
	Expr.find.CLASS = function( match, context, isXML ) {
		if ( typeof context.getElementsByClassName !== "undefined" && !isXML ) {
			return context.getElementsByClassName(match[1]);
		}
	};

	// release memory in IE
	div = null;
})();

function dirNodeCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];

		if ( elem ) {
			var match = false;

			elem = elem[dir];

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 && !isXML ){
					elem.sizcache = doneName;
					elem.sizset = i;
				}

				if ( elem.nodeName.toLowerCase() === cur ) {
					match = elem;
					break;
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

function dirCheck( dir, cur, doneName, checkSet, nodeCheck, isXML ) {
	for ( var i = 0, l = checkSet.length; i < l; i++ ) {
		var elem = checkSet[i];

		if ( elem ) {
			var match = false;
			
			elem = elem[dir];

			while ( elem ) {
				if ( elem.sizcache === doneName ) {
					match = checkSet[elem.sizset];
					break;
				}

				if ( elem.nodeType === 1 ) {
					if ( !isXML ) {
						elem.sizcache = doneName;
						elem.sizset = i;
					}

					if ( typeof cur !== "string" ) {
						if ( elem === cur ) {
							match = true;
							break;
						}

					} else if ( Sizzle.filter( cur, [elem] ).length > 0 ) {
						match = elem;
						break;
					}
				}

				elem = elem[dir];
			}

			checkSet[i] = match;
		}
	}
}

if ( document.documentElement.contains ) {
	Sizzle.contains = function( a, b ) {
		return a !== b && (a.contains ? a.contains(b) : true);
	};

} else if ( document.documentElement.compareDocumentPosition ) {
	Sizzle.contains = function( a, b ) {
		return !!(a.compareDocumentPosition(b) & 16);
	};

} else {
	Sizzle.contains = function() {
		return false;
	};
}

Sizzle.isXML = function( elem ) {
	// documentElement is verified for cases where it doesn't yet exist
	// (such as loading iframes in IE - #4833) 
	var documentElement = (elem ? elem.ownerDocument || elem : 0).documentElement;

	return documentElement ? documentElement.nodeName !== "HTML" : false;
};

var posProcess = function( selector, context ) {
	var match,
		tmpSet = [],
		later = "",
		root = context.nodeType ? [context] : context;

	// Position selectors must be done after the filter
	// And so must :not(positional) so we move all PSEUDOs to the end
	while ( (match = Expr.match.PSEUDO.exec( selector )) ) {
		later += match[0];
		selector = selector.replace( Expr.match.PSEUDO, "" );
	}

	selector = Expr.relative[selector] ? selector + "*" : selector;

	for ( var i = 0, l = root.length; i < l; i++ ) {
		Sizzle( selector, root[i], tmpSet );
	}

	return Sizzle.filter( later, tmpSet );
};

// EXPOSE

window.Sizzle = Sizzle;

})();
/*
  mustache.js — Logic-less templates in JavaScript

  See http://mustache.github.com/ for more info.
*/

var Mustache = function() {
  var Renderer = function() {};

  Renderer.prototype = {
    otag: "{{",
    ctag: "}}",
    pragmas: {},
    buffer: [],
    pragmas_implemented: {
      "IMPLICIT-ITERATOR": true
    },
    context: {},

    render: function(template, context, partials, in_recursion) {
      // reset buffer & set context
      if(!in_recursion) {
        this.context = context;
        this.buffer = []; // TODO: make this non-lazy
      }

      // fail fast
      if(!this.includes("", template)) {
        if(in_recursion) {
          return template;
        } else {
          this.send(template);
          return;
        }
      }

      template = this.render_pragmas(template);
      var html = this.render_section(template, context, partials);
      if(in_recursion) {
        return this.render_tags(html, context, partials, in_recursion);
      }

      this.render_tags(html, context, partials, in_recursion);
    },

    /*
      Sends parsed lines
    */
    send: function(line) {
      if(line != "") {
        this.buffer.push(line);
      }
    },

    /*
      Looks for %PRAGMAS
    */
    render_pragmas: function(template) {
      // no pragmas
      if(!this.includes("%", template)) {
        return template;
      }

      var that = this;
      var regex = new RegExp(this.otag + "%([\\w-]+) ?([\\w]+=[\\w]+)?" +
            this.ctag);
      return template.replace(regex, function(match, pragma, options) {
        if(!that.pragmas_implemented[pragma]) {
          throw({message: 
            "This implementation of mustache doesn't understand the '" +
            pragma + "' pragma"});
        }
        that.pragmas[pragma] = {};
        if(options) {
          var opts = options.split("=");
          that.pragmas[pragma][opts[0]] = opts[1];
        }
        return "";
        // ignore unknown pragmas silently
      });
    },

    /*
      Tries to find a partial in the curent scope and render it
    */
    render_partial: function(name, context, partials) {
      name = this.trim(name);
      if(!partials || partials[name] === undefined) {
        throw({message: "unknown_partial '" + name + "'"});
      }
      if(typeof(context[name]) != "object") {
        return this.render(partials[name], context, partials, true);
      }
      return this.render(partials[name], context[name], partials, true);
    },

    /*
      Renders inverted (^) and normal (#) sections
    */
    render_section: function(template, context, partials) {
      if(!this.includes("#", template) && !this.includes("^", template)) {
        return template;
      }

      var that = this;
      // CSW - Added "+?" so it finds the tighest bound, not the widest
      var regex = new RegExp(this.otag + "(\\^|\\#)\\s*(.+)\\s*" + this.ctag +
              "\n*([\\s\\S]+?)" + this.otag + "\\/\\s*\\2\\s*" + this.ctag +
              "\\s*", "mg");

      // for each {{#foo}}{{/foo}} section do...
      return template.replace(regex, function(match, type, name, content) {
        var value = that.find(name, context);
        if(type == "^") { // inverted section
          if(!value || that.is_array(value) && value.length === 0) {
            // false or empty list, render it
            return that.render(content, context, partials, true);
          } else {
            return "";
          }
        } else if(type == "#") { // normal section
          if(that.is_array(value)) { // Enumerable, Let's loop!
            return that.map(value, function(row) {
              return that.render(content, that.create_context(row),
                partials, true);
            }).join("");
          } else if(that.is_object(value)) { // Object, Use it as subcontext!
            return that.render(content, that.create_context(value),
              partials, true);
          } else if(typeof value === "function") {
            // higher order section
            return value.call(context, content, function(text) {
              return that.render(text, context, partials, true);
            });
          } else if(value) { // boolean section
            return that.render(content, context, partials, true);
          } else {
            return "";
          }
        }
      });
    },

    /*
      Replace {{foo}} and friends with values from our view
    */
    render_tags: function(template, context, partials, in_recursion) {
      // tit for tat
      var that = this;

      var new_regex = function() {
        return new RegExp(that.otag + "(=|!|>|\\{|%)?([^\\/#\\^]+?)\\1?" +
          that.ctag + "+", "g");
      };

      var regex = new_regex();
      var tag_replace_callback = function(match, operator, name) {
        switch(operator) {
        case "!": // ignore comments
          return "";
        case "=": // set new delimiters, rebuild the replace regexp
          that.set_delimiters(name);
          regex = new_regex();
          return "";
        case ">": // render partial
          return that.render_partial(name, context, partials);
        case "{": // the triple mustache is unescaped
          return that.find(name, context);
        default: // escape the value
          return that.escape(that.find(name, context));
        }
      };
      var lines = template.split("\n");
      for(var i = 0; i < lines.length; i++) {
        lines[i] = lines[i].replace(regex, tag_replace_callback, this);
        if(!in_recursion) {
          this.send(lines[i]);
        }
      }

      if(in_recursion) {
        return lines.join("\n");
      }
    },

    set_delimiters: function(delimiters) {
      var dels = delimiters.split(" ");
      this.otag = this.escape_regex(dels[0]);
      this.ctag = this.escape_regex(dels[1]);
    },

    escape_regex: function(text) {
      // thank you Simon Willison
      if(!arguments.callee.sRE) {
        var specials = [
          '/', '.', '*', '+', '?', '|',
          '(', ')', '[', ']', '{', '}', '\\'
        ];
        arguments.callee.sRE = new RegExp(
          '(\\' + specials.join('|\\') + ')', 'g'
        );
      }
      return text.replace(arguments.callee.sRE, '\\$1');
    },

    /*
      find `name` in current `context`. That is find me a value
      from the view object
    */
    find: function(name, context) {
      name = this.trim(name);

      // Checks whether a value is thruthy or false or 0
      function is_kinda_truthy(bool) {
        return bool === false || bool === 0 || bool;
      }

      var value;
      if(is_kinda_truthy(context[name])) {
        value = context[name];
      } else if(is_kinda_truthy(this.context[name])) {
        value = this.context[name];
      }

      if(typeof value === "function") {
        return value.apply(context);
      }
      if(value !== undefined) {
        return value;
      }
      // silently ignore unkown variables
      return "";
    },

    // Utility methods

    /* includes tag */
    includes: function(needle, haystack) {
      return haystack.indexOf(this.otag + needle) != -1;
    },

    /*
      Does away with nasty characters
    */
    escape: function(s) {
      s = String(s === null ? "" : s);
      return s.replace(/&(?!\w+;)|["'<>\\]/g, function(s) {
        switch(s) {
        case "&": return "&amp;";
        case "\\": return "\\\\";
        case '"': return '&quot;';
        case "'": return '&#39;';
        case "<": return "&lt;";
        case ">": return "&gt;";
        default: return s;
        }
      });
    },

    // by @langalex, support for arrays of strings
    create_context: function(_context) {
      if(this.is_object(_context)) {
        return _context;
      } else {
        var iterator = ".";
        if(this.pragmas["IMPLICIT-ITERATOR"]) {
          iterator = this.pragmas["IMPLICIT-ITERATOR"].iterator;
        }
        var ctx = {};
        ctx[iterator] = _context;
        return ctx;
      }
    },

    is_object: function(a) {
      return a && typeof a == "object";
    },

    is_array: function(a) {
      return Object.prototype.toString.call(a) === '[object Array]';
    },

    /*
      Gets rid of leading and trailing whitespace
    */
    trim: function(s) {
      return s.replace(/^\s*|\s*$/g, "");
    },

    /*
      Why, why, why? Because IE. Cry, cry cry.
    */
    map: function(array, fn) {
      if (typeof array.map == "function") {
        return array.map(fn);
      } else {
        var r = [];
        var l = array.length;
        for(var i = 0; i < l; i++) {
          r.push(fn(array[i]));
        }
        return r;
      }
    }
  };

  return({
    name: "mustache.js",
    version: "0.3.1-dev",

    /*
      Turns a template and view into HTML
    */
    to_html: function(template, view, partials, send_fun) {
      var renderer = new Renderer();
      if(send_fun) {
        renderer.send = send_fun;
      }
      renderer.render(template, view, partials);
      if(!send_fun) {
        return renderer.buffer.join("\n");
      }
    }
  });
}();
/*
    http://www.JSON.org/json2.js
    2010-11-17

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, strict: false, regexp: false */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (!this.JSON) {
    this.JSON = {};
}

(function () {
    "use strict";

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf()) ?
                   this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z' : null;
        };

        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ?
            '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
.test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
.replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function' ?
                    walk({'': j}, '') : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());
/**
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Object/keys
 */
Object.keys = function(o) {
	var result = [];
	if (o === undefined || o === null) {
		return result;
	}

	// 在Safari 5.0.2(7533.18.5)中，在这里用for in遍历parent会将prototype属性遍历出来，导致原型被指向一个错误的对象
	// 经过试验，在Safari下，仅仅通过 obj.prototype.xxx = xxx 这样的方式就会导致 prototype 变成自定义属性，会被 for in 出来
	// 而其他浏览器仅仅是在重新指向prototype时，类似 obj.prototype = {} 这样的写法才会出现这个情况
	// 因此，在使用时一定要注意
	for (var name in o) {
		if (o.hasOwnProperty(name)) {
			result.push(name);
		}
	}

	// for IE
	// 在IE下for in无法遍历出来修改过的call方法
	// 为什么允许修改call方法？对于一个class来说，没有直接Class.call的应用场景，任何Class都应该是new出来的，因此可以修改这个方法
	if (o.call !== undefined && o.call !== Function.prototype.call && result.indexOf('call') === -1) {
		result.push('call');
	}

	return result; 
};

/**
 * @method
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/isArray
 */
Array.isArray = Array.isArray || function(o) {
	return Object.prototype.toString.call(o) === '[object Array]';
};

/**
 * @method
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/forEach
 */
Array.prototype.forEach = Array.prototype.forEach || function(fn, bind) {
	for (var i = 0; i < this.length; i++) {
		fn.call(bind, this[i], i, this);
	}
};

/**
 * @method
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/indexOf
 */
Array.prototype.indexOf = Array.prototype.indexOf || function(str) {
	for (var i = 0; i < this.length; i++) {
		if (str === this[i]) {
			return i;
		}
	}
	return -1;
};

/**
 * @method
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/some
 */
Array.prototype.some = Array.prototype.some || function(fn, bind) {
	for (var i = 0, l = this.length; i < l; i++) {
		if ((i in this) && fn.call(bind, this[i], i, this)) return true;
	}
	return false;
};

/**
 * @method
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/every
 */
Array.prototype.every = Array.prototype.every || function(fn, bind) {
	for (var i = 0, l = this.length; i < l; i++) {
		if ((i in this) && !fn.call(bind, this[i], i, this)) return false;
	}
	return true;
};

/**
 * @method
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/map
 */
Array.prototype.map = Array.prototype.map || function (fn, bind) {
	var results = [];
	for (var i = 0, l = this.length; i < l; i++) {
		if (i in this) results[i] = fn.call(bind, this[i], i, this);
	}
	return results;
};

/**
 * @method
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/filter
 */
Array.prototype.filter = Array.prototype.filter || function(fn, bind) {
	var results = [];
	for (var i = 0, l = this.length; i < l; i++) {
		if ((i in this) && fn.call(bind, this[i], i, this)) results.push(this[i]);
	}
	return results;
};

/**
 * @method
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduce
 */
Array.prototype.reduce = Array.prototype.reduce || function(fun /*, initialValue */) {
	"use strict";

	if (this === undefined || this === null)
		throw new TypeError();

	var t = Object(this);
	var len = t.length >>> 0;
	if (typeof fun !== "function")
		throw new TypeError();

	// no value to return if no initial value and an empty array
	if (len === 0 && arguments.length == 1)
		throw new TypeError();

	var k = 0;
	var accumulator;
	if (arguments.length >= 2) {
		accumulator = arguments[1];
	} else {
		do {
			if (k in t) {
				accumulator = t[k++];
				break;
			}

			// if array contains no values, no initial value to return
			if (++k >= len) {
				throw new TypeError();
			}

		} while (true);
	}

	while (k < len) {
		if (k in t)
			accumulator = fun.call(undefined, accumulator, t[k], k, t);
		k++;
	}

	return accumulator;
};

/**
 * @method
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/reduceRight
 */
Array.prototype.reduceRight = Array.prototype.reduceRight || function(callbackfn /*, initialValue */) {
	"use strict";

	if (this === undefined || this === null)
		throw new TypeError();

	var t = Object(this);
	var len = t.length >>> 0;
	if (typeof callbackfn !== "function")
		throw new TypeError();

	// no value to return if no initial value, empty array
	if (len === 0 && arguments.length === 1)
		throw new TypeError();

	var k = len - 1;
	var accumulator;
	if (arguments.length >= 2) {
		accumulator = arguments[1];
	} else {
		do {
			if (k in this) {
				accumulator = this[k--];
				break;
			}

			// if array contains no values, no initial value to return
			if (--k < 0) {
				throw new TypeError();
			}
		}
		while (true);
	}

	while (k >= 0) {
		if (k in t)
			accumulator = callbackfn.call(undefined, accumulator, t[k], k, t);
		k--;
	}

	return accumulator;
};

/**
 * @method
 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/String/trim
 */
String.prototype.trim = String.prototype.trim || function() {
	// High Performance JavaScript 中描述此方法较快
	return this.replace(/^\s\s*/, "").replace(/\s\s*$/, "");
};

// 有些老页面引用了js/compact.js，其中有一个错误的Function.prototype.bind
if (!Function.prototype.bind || Function.prototype.bind === window.__hualuOldBind) {
	/**
 	 * @method
	 * @see https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
	 */
	Function.prototype.bind = function(object) {
		var method = this;
		var args = Array.prototype.slice.call(arguments, 1);
		return function() {
			return method.apply(object, args.concat(Array.prototype.slice.call(arguments)));
		};
	};
}
/**
 * @namespace
 * @name object
 */
/**@class Array*/
/**@class String*/
/**@class Function*/
var object = (function(globalHost) {

var object = function() {
};

// 获取function的name
// 判断function TEST() 是否能取到name属性来选择不同的算法函数
if ((function TEST(){}).name) {
	Function.__get_name__ = function(func) {
		return func.name;
	};
}
// IE
else {
	// IE下方法toString返回的值有可能是(开头
	var funcNameRegExp = /(?:^|\()function ([\w$]+)/;
	//Function.__get_name__((function a() {})) -> (function a(){}) -> a
	Function.__get_name__ = function(func) {
		// IE 下没有 Function.prototype.name，通过代码获得
		var result = funcNameRegExp.exec(func.toString());
		if (result) return result[1];
		return '';
	};
}

/**
 * 为obj增加properties中的成员
 * @name object.extend
 * @param {Object} obj 被扩展的对象
 * @param {Object} properties 扩展属性的来源对象
 * @param {Boolean|Function} ov 是否覆盖obj对象中的原有成员，如果是true（默认），则覆盖，false则不覆盖原有成员
 * 		如果传入的是function，则按照function的返回值来判断是否覆盖
 * 		function的参数依次是：属性值、目标对象、源对象
 */
object.extend = function(obj, properties, ov) {
	var filter = null;
	if (typeof ov == 'function') {
		filter = ov;
	} else if (ov === true || typeof ov === 'undefined') {
		filter = function(prop, dest, src) {
			return true;
		};
	} else {
		filter = function(prop, dest, src) {
			return !(prop in dest);
		};
	}

	for (var property in properties) {
		if (filter(property, obj, properties)) {
			obj[property] = properties[property];
		}
	}
	if (properties && properties.hasOwnProperty('call') && filter(obj, properties, 'call')) {
		obj.call = properties.call;
	}

	return obj;
};

/**
 * 浅拷贝
 * @name object.clone
 */
object.clone = function(obj) {
	var clone = {};
	for (var key in obj) clone[key] = obj[key];
	return clone;
};

/**
 * 将成员引用放到window上
 * @name object.bind
 */
object.bind = function(host) {
	object.extend(host, object);
};

object._loader = null;

return object;

})(window);
/**
 * OOP
 */
;(function(object) {

// 仿照 mootools 的overloadSetter
// 返回一个 key/value 这种形式的function参数的包装，使其支持{key1: value1, key2: value2} 这种传参形式
var enumerables = true;
for (var i in {toString: 1}) enumerables = null;
if (enumerables) enumerables = ['hasOwnProperty', 'valueOf', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'constructor'];
var overloadSetter = function(func, usePlural) {
	return function(a, b) {
		if (a === null) return this;
		if (usePlural || typeof a != 'string') {
			for (var k in a) func.call(this, k, a[k]);
			if (enumerables) {
				for (var i = enumerables.length; i > 0; i--) {
					k = enumerables[i];
					if (a.hasOwnProperty(k)) func.call(this, k, a[k]);
				}
			}
		} else {
			func.call(this, a, b);
		}
		return this;
	};
};

/**
 * propery 特性支持getter函数，用法：
 * obj.get(prop_name)
 * 会被放到 cls.prototype.get
 * @param name 需要获取的成员
 * @param bind 如果目标成员是个函数，则使用bind进行绑定后返回，非函数忽略此参数
 */
var getter = function(name, bind) {
	var value = Object.__getattribute__(this, name);
	if (bind !== false && Class.isMethod(value)) {
		bind = bind || this;
		return value.bind(bind);
	}
	return value;
};

/**
 * propery 特性支持getter函数，用法：
 * obj.set(prop_name, value)
 * 会被放到 cls.prototype.set
 */
var setter = overloadSetter(function(prop, value) {
	if ('__setattr__' in this) {
		this.__setattr__(prop, value);
	} else {
		Object.__setattr__(this, prop, value);
	}
});

/**
 * 从类上获取成员
 * 会被放到cls.get
 * @param name 需要获取的成员
 * @param bind 如果目标成员是个函数，则使用bind进行绑定后返回，非函数忽略此参数，false则不绑定
 */
var membergetter = function(name, bind) {
	var member = Type.__getattribute__(this, name);
	if (bind !== false && Class.isMethod(member)) {
		bind = bind || this;
		return member.bind(bind);
	}
	return member;
};

/**
 * 判断是否存在成员
 * 会被放到cls.has
 */
var memberchecker = function(name) {
	if (name == '@mixins') name = '__mixins__';
	var proto = this.prototype;
	var properties = proto.__properties__;
	return (name in this || name in proto || (properties && name in properties));
};

/**
 * MyClass.set(name, value);
 * MyClass.set({name1: value1, name2: value2})
 * 会被放到 cls.set
 * 子类不会被覆盖
 */
var membersetter = overloadSetter(function(name, member) {
	// 从metaclass中获得__setattr__
	if ('__metaclass__' in this) {
		Type.__getattribute__(this.__metaclass__, '__setattr__').call(this.__metaclass__, this, name, member);
	}
	// 未设置metaclass则默认为Type
	else {
		Type.__setattr__(this, name, member);
	}
});

/**
 * 对于支持defineProperty的浏览器，可考虑将此setter不设置任何动作
 */
var nativesetter = function(prop, value) {
	this[prop] = value;
};

/**
 * 获取一个类的子类
 * 会被放到 cls.__subclasses__
 */
var subclassesgetter = function() {
	return this.__subclassesarray__;
};

/**
 * 调用cls继承链中名字为name的成员
 */
var parent = function(cls, name, args) {
	if (!name) {
		throw new Error('can not get function name when this.parent called');
	}

	// 拥有此方法的代码书写的类
	var ownCls = cls;

	// parent应该调用“代码书写的方法所在的类的父同名方法”
	// 而不是方法调用者实例的类的父同名方法
	// 比如C继承于B继承于A，当C的实例调用从B继承来的某方法时，其中调用了this.parent，应该直接调用到A上的同名方法，而不是B的。
	// 因此，这里通过hasOwnProperty，从当前类开始，向上找到同名方法的原始定义类
	while (ownCls && !ownCls.prototype.hasOwnProperty(name)) {
		ownCls = ownCls.__base__;
	}

	var base = ownCls.__base__;
	var mixins = ownCls.__mixins__;
	var member, owner;

	// 先从base中找同名func
	if (base && base.get && base.has(name)) {
		owner = base;
		member = Type.__getattribute__(base, name);
	}
	// 再从mixins中找同名func
	else if (mixins && mixins.length && mixins.some(function(mixin) {
		owner = mixin;
		return mixin.has(name);
	})) {
		member = Type.__getattribute__(owner, name);
	}

	if (!member || typeof member != 'function') {
		throw new Error('no such method in parent : \'' + name + '\'');
	} else {
		return member.apply(owner, args);
	}
};

function renameCheck(func, prop, value) {
	if (prop === '__name__' && func[prop] && func[prop] !== value) {
		if (typeof console != 'undefined' && console.warn) {
			console.warn('请不要将同一个方法赋值给多个类成员：' + func[prop] + ' --> ' + value);
		}
	}
}

/**
 * 返回一个绑定了self的instancemethod
 * 若self为false，则返回一个未绑定的方法
 * 若self为undefined，则动态采用this为self
 * 若self为true，则动态采用this为cls
 */
var instancemethod = function(func, self) {
	// 区分两种方法，用typeof为function判定并不严谨，function也可能是一个实例
	var _instancemethod;
	var im_self;

	// 意味着不绑定，传参时需要手工传im_self进去
	if (self === false) {
		_instancemethod = function(self) {
			// TODO 检测self是否是正确的类型
			return this.prototype[func.__name__].im_func.apply(this.__this__, arguments);
		}
	}
	// 绑定self，若为undefined，则在运行时使用this
	else {
		_instancemethod = function() {
			var args = [].slice.call(arguments, 0);
			// 绑定class
			if (self === true) {
				// 在class上调用
				if (typeof this == 'function') {
					im_self = this;
				}
				// 在instance上调用
				else {
					im_self = this.__class__;
				}
			} else {
				im_self = this;
			}
			args.unshift(im_self);
			return func.apply(this.__this__, args);
		};
	}
	_instancemethod.im_self = self;
	_instancemethod.__class__ = arguments.callee;
	_instancemethod.im_func = func;
	_instancemethod.__setattr__ = function(prop, value) {
		renameCheck(func, prop, value);
		this[prop] = value;
	}; // 检测的是im_func的name
	return _instancemethod;
};

var staticmethod = this.staticmethod = function(func) {
	return {
		__class__: arguments.callee,
		im_func: func,
		__setattr__: function(prop, value) {
			renameCheck(this, prop, value);
			this[prop] = value;
		}
	};
};

var classmethod = this.classmethod = function(func, isinstance) {
	var obj = {
		__class__ : arguments.callee,
		im_func : func,
		__setattr__: function(prop, value) {
			renameCheck(this, prop, value);
			this[prop] = value;
		}
	};
	return obj;
};

var property = this.property = function(fget, fset) {
	var p = {};
	p.__class__ = arguments.callee;
	p.__setattr__ = function(prop, value) {
		renameCheck(this, prop, value);
		this[prop] = value;
	}
	p.fget = fget;
	p.fset = fset;
	return p;
};

// 获取一个native function的class形式用于继承
var createNativeClass = function(source, methodNames) {
	var cls = new Class(function() {
		for (var i = 0, l = methodNames.length; i < l; i++) {
			this[methodNames[i]] = (function(name) {
				return function() {
					return source.prototype[name].apply(arguments[0], [].slice.call(arguments, 1));
				};
			})(methodNames[i]);
		}
	});
	return cls;
};

// IE不可以通过prototype = new Array的方式使function获得数组功能。
var _nativeExtendable = (function() {
	// IE和webkit没有统一访问方法（Array.forEach)，避免使用native extend
	if (!Array.push) return false;

	// 理论上走不到
	var a = function() {};
	a.prototype = new Array;
	var b = new a;
	b.push(null);
	return !!b.length;
})();

var ArrayClass, StringClass;

/**
 * 从一个object上获取成员
 */
Object.__getattribute__ = function(obj, name) {
	var property = obj.__properties__[name];
	// property
	if (property) {
		if (property.fget) {
			return property.fget.call(obj.__this__, obj);
		}
		else {
			throw new Error('get not allowed property ' + name);
		}
	}
	// 已存在此成员
	else if (name in obj) {
		return obj[name];
	}
	// 调用getattr
	else if (obj.__getattr__) {
		return obj.__getattr__.call(obj, name);
	}
	// 无此成员，返回
	else {
		return undefined;
	}
};

/**
 * 设置一个对象的成员
 * object.__setattr__ 为兼容处理
 */
Object.__setattr__ = object.__setattr__ = function(obj, prop, value) {
	var property = null;
	if (obj.__properties__) {
		property = obj.__properties__[prop];
	}
	// 此prop不是property，直接赋值即可。
	if (!property) {
		obj[prop] = value;
	}
	// 有fset
	else if (property.fset) {
		property.fset.call(obj.__this__, obj, value);
	}
	// 未设置fset，不允许set
	else {
		throw 'set not allowed property ' + prop;
	}
};

// 获取父类的实例，用于 cls.prototype = new parent
Object.__new__ = function(cls) {
	if (cls === Array || cls === String) return new cls;
	cls.__prototyping__ = true;
	var instance = new cls();
	delete cls.__prototyping__;
	return instance;
};

/**
 * 小写type为兼容处理
 * @class
 */
var Type = this.Type = this.type = function() {
};

Type.__class__ = Type;

/**
 * 创建一个类的核心过程
 */
Type.__new__ = function(metaclass, name, base, dict) {
	var cls = function() {
		// 通过Object.__new__获取一个空实例
		if (cls.__prototyping__) return this;

		// new OneMetaClass
		// __constructs__是Type才有的，继承于object的类没有
		if (cls.__constructs__) {
			return cls.__constructs__(arguments);
		}
		// new OneClass
		else {
			this.__class__ = cls;
			Class.initMixins(cls, this);
			var value = this.initialize? this.initialize.apply(this, arguments) : null;
			return value;
		}
	};

	/*
	 * 初始化成员
	 * 注意这里从base获取成员的时候，base有可能是object系的，也有可能是Type系的
	 */
	cls.__subclassesarray__ = [];
	cls.__subclasses__ = subclassesgetter;
	// 存储此类上的classmethod和staticmethod的名字，方便继承时赋值
	cls.__classbasedmethods__ = [];
	// cls.__module__，从loader的runtime中获取
	if (object.runtime) {
		cls.__module__ = object.runtime.stack[object.runtime.stack.length - 1].id;
	} else {
		cls.__module__ = '';
	}
	// cls.__mixin__ 为兼容
	cls.set = cls.__mixin__ = membersetter;
	cls.get = membergetter;
	cls.has = memberchecker;
	// 只有__metaclass__和__class__是指向metaclass的，其他成员都是从base继承而来。
	cls.__metaclass__ = metaclass;
	cls.__class__ = metaclass;
	// 从base继承而来
	cls.__new__ = base.__new__;
	cls.__dict__ = dict;

	// 继承于Type的类才有__constructs__
	cls.__constructs__ = base.__constructs__ || null;

	// 将base上的classmethod、staticmethod成员放到cls上
	// Object和Type上没有任何classmethod、staticmethod，无需处理
	if (base !== Object && base !== Type) {
		;(base.__classbasedmethods__ || []).forEach(function(name) {
			cls[name] = base[name];
			cls.__classbasedmethods__.push(name);
		});
	}

	cls.__constructing__ = true;

	/*
	 * 实现继承
	 */
	cls.prototype = Object.__new__(base);
	cls.prototype.constructor = cls;
	// Array / String 没有 subclass，需要先判断一下是否存在 subclassesarray
	if (base.__subclassesarray__) base.__subclassesarray__.push(cls);

	/*
	 * 实现property
	 */
	var proto = cls.prototype;
	// 有可能已经继承了base的__properties__了
	var baseProperties = proto.__properties__ || {};
	proto.__properties__ = object.extend({}, baseProperties);

	/*
	 * 同时设置cls和其prototype上的成员
	 */
	//if (base === Type) {
		//Type.__setattr__(cls, 'initialize', Type.__getattribute__(base, 'initialize'));
	//}
	Type.__setattr__(cls, '__setattr__', Type.__getattribute__(base, '__setattr__'));
	Type.__setattr__(cls, '__base__', base);
	// 支持 this.parent 调用父级同名方法
	Type.__setattr__(cls, '__this__', {
		base: base,
		parent: function() {
			// 一定是在继承者函数中调用，因此调用时一定有 __name__ 属性
			return parent(cls, arguments.callee.caller.__name__, arguments);
		}
	});

	// 正常来讲，cls是有metaclass的实例，即 OneClass = new MetaClass，class上面应该有metaclass的成员
	// 但由于js的语言特性，是无法真正的“new”出一个function的（继承于Function没用），其没有原型链
	// 因此只能考虑通过遍历将metaclass中的成员赋值到cls上，影响性能，且此类需求只在metaclass的制作过程中有，并没太大必要，比如：
	// var M = new Class(Type, {
	//   a: function() {},
	//   __new__(cls) {}, // 这个cls是M，可以通过get获取到a
	//   initialize(cls) {} // 这个cls就是生成的cls了，此是无法通过get获取到a，而python是可以的
	// });
	// 另外一个考虑，通过修改membergetter使一个class会去其metaclass中寻找成员。
	// 下面的代码是用遍历的方法使其支持的代码
	//Class.keys(metaclass).forEach(function(name) {
		//cls[name] = function() {
			//var args = Array.prototype.slice.call(arguments, 0);
			//args.unshift(cls);
			//return metaclass.prototype[name].im_func.apply(cls, args);
		//};
	//});

	/*
	 * Dict
	 */
	for (var k in dict) {
		Type.__setattr__(cls, k, dict[k]);
	}

	/*
	 * Mixin
	 */
	var mixins = cls.__mixins__;
	if (mixins) {
		mixins.forEach(function(mixin) {
			Class.keys(mixin).forEach(function(name) {
				if (cls.has(name)) return; // 不要覆盖自定义的
				var member = Type.__getattribute__(mixin, name);
				Type.__setattr__(cls, name, member);
			});
		});
	}

	/*
	 * 默认成员，若之前有定义也强制覆盖掉
	 */
	cls.prototype.get = getter;
	cls.prototype.set = setter;
	cls.prototype._set = nativesetter;

	delete cls.__constructing__;

	return cls;
};

/**
 * 设置属性到类
 */
Type.__setattr__ = function(cls, name, member) {
	if (name == '@mixins') name = '__mixins__';

	var proto = cls.prototype;
	var properties = proto.__properties__;
	var subs = cls.__subclassesarray__;
	var constructing = cls.__constructing__;

	if (['__mixins__', '__new__', '__this__', '__base__'].indexOf(name) != -1) {
		if (!member || (typeof member != 'object' && typeof member != 'function')) {
			return;
		}
	}
	
	// 类构建完毕后才进行set，需要先删除之前的成员
	delete cls[name];
	delete proto[name];
	delete properties[name];

	// 这里的member指向new Class参数的书写的对象/函数
	if (['__new__', '__metaclass__', '__mixins__'].indexOf(name) != -1) {
		if (member && (typeof member == 'object' || typeof member == 'function')) {
			cls[name] = member;
		}
	}
	// 
	else if (['__this__', '__base__'].indexOf(name) != -1) {
		cls[name] = proto[name] = member;
	}
	// 有可能为空，比如 this.test = null 或 this.test = undefined 这种写法;
	else if (member == null) {
		proto[name] = member;
	}
	// 先判断最常出现的instancemethod
	// this.a = function() {}
	else if (member.__class__ === undefined && typeof member == 'function') {
		proto[name] = instancemethod(member);
		proto[name].__setattr__('__name__', name);
		// 这样赋值__name__，确保__name__都是被赋值在开发者所书写的那个function上，能够通过arguments.callee.__name__获取到。
		member.__name__ = name;
		// 初始化方法放在cls上，metaclass会从cls上进行调用
		if (name == 'initialize') {
			cls[name] = instancemethod(member, false);
		}
	}
	// this.a = property(function fget() {}, function fset() {})
	else if (member.__class__ === property) {
		member.__setattr__('__name__', name);
		properties[name] = member;
		// 当prototype覆盖instancemethod/classmethod/staticmethod时，需要去除prototype上的属性
		proto[name] = undefined;
	}
	// 在继承的时候，有可能直接把instancemethod传进来，比如__setattr__
	else if (member.__class__ === instancemethod) {
		// 重新绑定
		proto[name] = instancemethod(member.im_func);
		// 绑定了cls的instancemethod，意味着是一个classmethod
		if (member.im_self == true) {
			cls[name] = member;
		}
	}
	// this.a = classmethod(function() {})
	else if (member.__class__ === classmethod) {
		member.__setattr__('__name__', name);
		member.im_func.__name__ = name;
		// classmethod，都绑定其class
		cls[name] = proto[name] = instancemethod(member.im_func, true);
		cls.__classbasedmethods__.push(name);
	}
	// this.a = staticmethod(function() {})
	else if (member.__class__ === staticmethod) {
		member.__setattr__('__name__', name);
		member.im_func.__name__ = name;
		cls[name] = proto[name] = member.im_func;
		cls.__classbasedmethods__.push(name);
	}
	// this.a = new Class({})
	else if (Class.instanceOf(member, Type)) {
		cls[name] = proto[name] = member;
	}
	// this.a = someObject
	else {
		proto[name] = member;
	}

	// 所有子类cls上加入
	// 在constructing时肯定没有子类，做个标记直接返回
	if (!constructing && name in cls && subs) {
		subs.forEach(function(sub) {
			// !(name in sub) 与 !name in sub 得到的结果不一样
			if (!(name in sub)) {
				Type.__setattr__(sub, name, member);
			}
		});
	}
};

/**
 * 删除类成员
 */
Type.__delattr__ = function(cls, name) {
	delete cls[name];
	delete cls.prototype[name];
	delete cls.prototype.__properties__[name];
};

/**
 * 从类上获取成员
 */
Type.__getattribute__ = function(cls, name) {
	if (name == '@mixins') {
		name = '__mixins__';
	}
	var proto = cls.prototype;
	var properties = proto.__properties__;
	var metaclass = cls.__metaclass__;
	var member;

	// 直接在自己身上找
	if (name in cls) {
		member = cls[name];
	}

	// 找property
	else if (properties && properties[name] !== undefined) {
		member = properties[name];
	}

	// 找到instancemethod
	else if (proto[name] && proto[name].__class__ == instancemethod) {
		// 对于instancemethod，需要返回重新bind的方法
		// 为保证每次都能取到相同的成员，保存在cls[name]上，下次直接就在cls上找到了
		cls[name] = member = instancemethod(proto[name].im_func, false);
	}

	// 去其metaclass中找
	// Type也要找，可以找到initialize
	else if (metaclass && (member = Type.__getattribute__(metaclass, name)) !== undefined) {
		// 将metaclass上的成员重新包装后放到cls上，需要把cls当成一个instance
		if (member.__class__ === instancemethod) {
			// 这里把cls当成一个instance了（metaclass的instance）
			// 重新绑定
			member = instancemethod(member.im_func, true);
		}
		cls[name] = member;
	}

	// 找到普通成员
	else {
		member = proto[name];
	}

	return member;
};

/**
 * new Class 或 new OneMetaClass 的入口调用函数
 * 此方法只放在Type上，可用于判断一个类是Object系的还是Type系的
 * Object要用的时候用Type.__constructs__.call(Object, arguments)调用即可
 */
Type.__constructs__ = function(args) {
	var length = args.length;
	if (length < 1) throw new Error('bad arguments');

	// name
	var name = null;

	// base
	var base = length > 1? args[0] : Object;
	if (typeof base != 'function' && typeof base != 'object') {
		throw new Error('base is not function or object');
	}
	if (base) {
		// IE不能extend native function，用相应的class包装一下
		if (!_nativeExtendable) {
			if (base === Array) {
				base = ArrayClass;
			} else if (base === String) {
				base = StringClass;
			}
		}
	}

	// dict
	var dict = args[length - 1], factory;
	if (typeof dict != 'function' && typeof dict != 'object') {
		throw new Error('constructor is not function or object');
	}
	if (dict instanceof Function) {
		factory = dict;
		dict = {};
		factory.call(dict);
	}

	var metaclass;
	// new Class()，用class生成一个Object
	if (this === Object) {
		metaclass = dict.__metaclass__ || base.__metaclass__ || Type;
	}
	// new OneMetaClass，用this生成一个class
	else {
		metaclass = this;
	}

	// 创建&初始化
	var cls = metaclass.__new__(metaclass, name, base, dict);

	if (!cls || typeof cls != 'function') {
		throw new Error('__new__ method should return cls');
	}
	Type.__getattribute__(metaclass, 'initialize').call(metaclass, cls, name, base, dict);
	return cls;
};

Type.initialize = function() {
};

Object.__class__ = Type;

/**
 * 类的定义
 * @namespace Class
 */
var Class = this.Class = function() {
	// 通过Object调用__constructs__，获取metaclass的途径不同
	return Type.__constructs__.call(Object, arguments);
};

/**
 * mixin时调用mixin的initialize方法，保证其中的初始化成员能够被执行
 */
Class.initMixins = function(cls, instance) {
	if (!cls) {
		return;
	}
	// 初始化父类的mixin
	if (cls.__base__) {
		Class.initMixins(cls.__base__, instance);
	}
	var mixins = cls.__mixins__;
	if (mixins) {
		// 这里必须是instance.__this__，因为initialize.call调用中已经设置了this指向的是instance
		instance.__this__.mixining = true;
		for (var i = 0, l = mixins.length, mixin; i < l; i++) {
			mixin = mixins[i];
			if (mixin.prototype && typeof mixin.prototype.initialize == 'function') {
				mixin.prototype.initialize.call(instance);
			}
		}
		delete instance.__this__.mixining;
	}
	
};

/**
 * 在new Class的callback中mixin
 * var MyClass = new Class(function() {
 *	Class.mixin(this, AnotherClass);
 * })
 */
Class.mixin = function(dict, cls) {
	if (!dict || typeof dict != 'object') {
		return;
	}
	if (cls === Array) {
		cls = ArrayClass;
	} else if (cls === String) {
		cls = StringClass;
	}
	dict.__mixins__ = dict.__mixins__ || [];
	dict.__mixins__.push(cls);
};

/**
 * 是否存在property
 */
Class.hasProperty = function(obj, name) {
	return (obj && obj.__properties__) ? (name in obj.__properties__) : false;
};

/**
 * 是否存在类成员
 */
Class.hasMember = function(cls, name) {
	if (!cls) return false;
	if (name in cls.prototype) return true;
	return false;
};

/**
 * 是否是方法
 */
Class.isMethod = function(member) {
	if (typeof member == 'function') {
		if (!member.__class__
				|| member.__class__ == instancemethod
				|| member.__class__ == staticmethod
				|| member.__class__ == classmethod
		   ) {
			return true;
		}
	}
	return false;
};

/**
 * 所有properties
 */
Class.getPropertyNames = function(obj) {
	return (obj && obj.__properties__) ? Object.keys(obj.__properties__) : [];
};

/**
 * 将host注射进class，使其self指向host
 * @param cls 被注射的class
 * @param host 注射进去的对象
 * @param args 构造的参数
 * @param filter 过滤器，实现选择性注射
 */
Class.inject = function(cls, host, args, filter) {
	if (typeof cls != 'function') {
		throw new Error('bad arguments.');
	};
	var argsLen = arguments.length;
	if (argsLen === 2) {
		args = [];
		filter = true;
	} else if (argsLen === 3) {
		if (Array.isArray(args)) {
			args = args || [];
			filter = true;
		} else {
			filter = args;
			args = [];
		}
	}

	host.__class__ = cls;
	host.__properties__ = cls.prototype.__properties__;
	var p = Object.__new__(cls);
	object.extend(host, p, filter);
	Class.initMixins(cls, host);
	if (typeof cls.prototype.initialize == 'function') {
		cls.prototype.initialize.apply(host, args);
	}
};

/**
 * 判断成员是否是一个type类型的
 */
Class.instanceOf = function(obj, func) {
	if (typeof func != 'function') {
		throw new Error('bad arguments.');
	}

	var cls;

	// 查询一个func的constructor，js中的function是没有原型继承的，只能通过递归查询。
	// 一般来说就是Type
	if (typeof obj == 'function') {
		// 遍历实例的创建者继承链，找是否与func相同
		cls = obj.__class__;
		if (cls) {
			do {
				if (cls === func) return true;
			} while (cls = cls.__base__);
		}
	}
	// 查询普通对象的constructor，可直接使用instanceof
	else {
		return obj instanceof func;
	}
	return false;
};

/**
 * 获取一个class的继承链
 */
Class.getChain = function(cls) {
	if (!cls) {
		return [];
	}
	var result = [cls];
	while (cls.__base__) {
		result.push(cls.__base__);
		cls = cls.__base__;
	}
	return result;
};

/**
 * 将一个类的所有子类形成平面数组返回
 * 会在Class.mixin中用到
 */
Class.getAllSubClasses = function(cls) {
	if (!cls || !cls.__subclassesarray__) {
		return [];
	}
	var array = cls.__subclassesarray__;
	var queue = [].concat(array), ele = queue.shift(), subs;
	while (ele != null) {
		subs = ele.__subclassesarray__;
		if (subs != null) {
			queue = queue.concat(subs);
			array = array.concat(subs);
		}
		ele = queue.shift();
	}
	return array;
};

/**
 * 遍历一个类成员
 * 获取类成员通过cls.get(name)
 */
Class.keys = function(cls) {
	if (!cls || !cls.prototype) {
		return [];
	}
	var keys = [];
	// 找到全部的，不仅仅是 hasOwnProperty 的，因此不能用Object.keys代替
	for (var prop in cls.prototype) {
    	keys.push(prop);
    }
	
	keys = keys.filter(function(name) {
		// 这3个需要过滤掉，是为了支持property加入的内置成员
		// initialize也需要过滤，当mixin多个class的时候，initialize默认为最后一个，这种行为没意义
		return !(name.indexOf('__') == 0 && name.slice(-2) == '__') && !(['get', 'set', '_set', 'initialize', 'constructor'].indexOf(name) != -1);
	});
	return keys;
};

ArrayClass = createNativeClass(Array, ["concat", "indexOf", "join", "lastIndexOf", "pop", "push", "reverse", "shift", "slice", "sort", "splice", "toString", "unshift", "valueOf", "forEach", "some", "every", "map", "filter", "reduce", "reduceRight"]);
ArrayClass.prototype.length = 0;
StringClass = createNativeClass(String, ["charAt", "charCodeAt", "concat", "indexOf", "lastIndexOf", "match", "replace", "search", "slice", "split", "substr", "substring", "toLowerCase", "toUpperCase", "valueOf", "trim"]);
StringClass.prototype.length = 0;
})(object);

/*
 * 变量说明：
 * 	pkg - 未实例化的模块
 * 	module - 实例化的模块
 * 	dep - 通过toDep方法处理过的依赖信息
 * 	dependency - 字符串形式保存依赖信息
 * 	parent - 在execute阶段当前模块的调用者
 * 	owner - 在load阶段当前依赖的拥有者
 * 	name - 点号形式的模块名字
 * 	id - 路径形式的模块名字
 */

;(function(object) {

// 可以用于scheme的字符
var scheme_chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-.';

/**
 * 在字符串url中查找target字符后，利用result对象，返回截断后的前、后字符串
 * @param {Object} result 重复利用的用于返回结果的对象（避免太多内存垃圾产生）
 * @param {String} url 需要截取的url
 * @param {String} target 截断的字符组成的字符串
 * @param {Boolean} remainFirst 是否要保留匹配的字符
 *
 * @return {Object} 形如 {got:'', remained:''}的结果对象
 */
function splitUntil(result, url, target, remainFirst) {
	var min = url.length;
	for(var i=0, len = url.length; i < len; i++) {
		if (target.indexOf(url.charAt(i)) != -1) {
			if (i < min) {
				min = i;
				break;
			}
		}
	}
	result.got = url.substring(0, min);
	result.remained = (remainFirst? url.substring(min) : url.substring(min + 1));
	return result;
}

/**
 * 解析一个url为 scheme / netloc / path / params / query / fragment 六个部分
 * @see http://docs.python.org/library/urlparse.html
 * @example 
 * http://www.renren.com:8080/home/home2;32131?id=31321321&a=1#//music/?from=homeleft#fdalfdjal
 * --> 
 * [http, www.renren.com:8080, /home/home2, 32131, id=31321321&a=1, //music/?from=homeleft#fdalfdjal]
 */
function urlparse(url, default_scheme) {
	if (typeof url != 'string') {
		return ['', '', '', '', '', ''];
	}
	var scheme = '', netloc='', path = '', params = '', query = '', fragment = '', i = 0;
	i = url.indexOf(':');
	if (i > 0) {
		if (url.substring(0, i) == 'http') {
			scheme = url.substring(0, i).toLowerCase();
			url = url.substring(i+1);
		} else {
			for (i = 0, len = url.length; i < len; i++) {
				if (scheme_chars.indexOf(url.charAt(i)) == -1) {
					break;
				}
			}
			scheme = url.substring(0, i);
			url = url.substring(i + 1);
		}
	}
	if (!scheme && default_scheme) {
		scheme = default_scheme;
	}
	var splited = {};
	if (url.substring(0, 2) == '//') {
		splitUntil(splited, url.substring(2), '/?#', true);
		netloc = splited.got;
		url = splited.remained;
	}

	if (url.indexOf('#') != -1) {
		splitUntil(splited, url, '#');
		url = splited.got;
		fragment = splited.remained;
	}
	if (url.indexOf('?') != -1) {
		splitUntil(splited, url, '?');
		url = splited.got;
		query = splited.remained;
	}
	if (url.indexOf(';') != -1) {
		splitUntil(splited, url, ';');
		path = splited.got;
		params = splited.remained;
	}
	
	if (!path) {
		path = url;
	}
	return [scheme, netloc, path, params, query, fragment];
};

/**
* 将兼容urlparse结果的url部分合并成url
*/
function urlunparse(parts) {
	if (!parts) {
		return '';
	}
	var url = '';
	if (parts[0]) url += parts[0] + '://' + parts[1];
	if (parts[1] && parts[2] && parts[2].indexOf('/') != 0) url += '/';
	url += parts[2];
	if (parts[3]) url += ';' + parts[3];
	if (parts[4]) url += '?' + parts[4];
	if (parts[5]) url += '#' + parts[5];

	return url;
};

/**
* 合并两段url
*/
function urljoin(base, url) {
	// 逻辑完全照抄python的urlparse.py

	if (!base) {
		return url;
	}

	if (!url) {
		return base;
	}

	url = String(url);
	base = String(base);

	var bparts = urlparse(base);
	var parts = urlparse(url, bparts[0]);

	// scheme
	if (parts[0] != bparts[0]) {
		return url;
	}

	// netloc
	if (parts[1]) {
		return urlunparse(parts);
	}

	parts[1] = bparts[1];

	// path
	if (parts[2].charAt(0) == '/') {
		return urlunparse(parts);
	}

	// params
	if (!parts[2] && !parts[3]) {
		parts[2] = bparts[2];
		parts[3] = bparts[3];
		if (!parts[4]) {
			parts[4] = bparts[4];
		}
		return urlunparse(parts);
	}

    var segments = bparts[2].split('/').slice(0, -1).concat(parts[2].split('/'));
	var i;

	// 确保能够生成最后的斜线
	if (segments[segments.length - 1] == '.') {
		segments[segments.length - 1] = '';
	}

	// 去掉所有'.'当前目录
	for (i = 0, l = segments.length; i < l; i++) {
		if (segments[i] == '.') {
			segments.splice(i, 1);
			i--;
		}
	}

	// 合并所有'..'
	while (true) {
		i = 1;
		n = segments.length - 1;
		while (i < n) {
			if (segments[i] == '..' && ['', '..'].indexOf(segments[i - 1]) == -1) {
				segments.splice(i - 1, 2);
				break;
			}
			i++;
		}
		if (i >= n) {
			break;
		}
	}

	if (segments.length == 2 && segments[0] == '' && segments[1] == '..') {
		segments[segments.length - 1] = '';
	}
	else if (segments.length >= 2 && segments[segments.length - 1] == '..') {
		segments.pop();
		segments.pop();
		segments.push('');
	}

	parts[2] = segments.join('/');

	return urlunparse(parts);
}

/**
 * 计算当前引用objectjs的页面文件的目录路径
 */
function calculatePageDir() {
	var loc = window['location'];
	var pageUrl = loc.protocol + '//' + loc.host + (loc.pathname.charAt(0) !== '/' ? '/' : '') + loc.pathname; 
	// IE 下文件系统是以\为分隔符，统一改为/
	if (pageUrl.indexOf('\\') != -1) {
		pageUrl = pageUrl.replace(/\\/g, '/');
	}
	var pageDir = './';
	if (pageUrl.indexOf('/') != -1) {
		// 去除文件，留下目录path
		pageDir = pageUrl.substring(0, pageUrl.lastIndexOf('/') + 1);
	}
	return pageDir;
}

/**
 * 清理路径url，去除相对寻址符号
 */
function cleanPath(path) {
	// 去除多余的/
	path = path.replace(/([^:\/])\/+/g, '$1\/');
	// 如果没有相对寻址，直接返回path
	if (path.indexOf('.') === -1) {
		return path;
	}

	var parts = path.split('/');
	// 把所有的普通var变量都写在一行，便于压缩
	var result = [];

	for (var i = 0, part, len = parts.length; i < len; i++) {
		part = parts[i];
		if (part === '..') {
			if (result.length === 0) {
				throw new Error('invalid path: ' + path);
			}
			result.pop();
		} else if (part !== '.') {
			result.push(part);
		}
	}

	// 去除尾部的#号
	return result.join('/').replace(/#$/, '');
}

/**
 * 模块
 * @class
 */
function Module(name) {
	this.__name__ = name;
}
Module.prototype.toString = function() {
	return '<module \'' + this.__name__ + '\'>';
};

/**
 * 找不到模块Error
 * @class
 */
function NoModuleError(id) {
	this.message = 'no module named ' + id;
};
NoModuleError.prototype = new Error();

/**
 * 未对模块进行依赖
 * @class
 */
function ModuleRequiredError(name, parent) {
	this.message = parent.id + ': module ' + name + ' required';
};
ModuleRequiredError.prototype = new Error();

/**
 * 循环依赖Error
 * @class
 * @param stack 出现循环依赖时的堆栈
 * @param pkg 触发了循环依赖的模块
 */
function CyclicDependencyError(stack, pkg) {
	this.runStack = stack;
	var msg = '';
	stack.forEach(function(m, i) {
		msg += m.module.id + '-->';
	});
	msg += pkg.id;
	this.message = msg + ' cyclic dependency.';
}
CyclicDependencyError.prototype = new Error();

/**
 * 普通Package
 * @class
 */
function CommonJSPackage(id, dependencies, factory) {
	Package.apply(this, arguments);
}

CommonJSPackage.prototype = new Package();

CommonJSPackage.prototype.constructor = CommonJSPackage;

CommonJSPackage.prototype.make = function(name, context, deps, runtime) {
	var exports = new Module(name);
	// 只是暂时存放，为了factory执行时可以通过sys.modules找到自己，有了返回值后，后面需要重新addModule
	runtime.modules[name] = exports;
	runtime.packages[name] = this;
	var require = this.createRequire(name, context, deps, runtime);
	var returnExports = this.factory.call(exports, require, exports, this);
	if (returnExports) {
		returnExports.__name__ = exports.__name__;
		exports = returnExports;
	}
	runtime.addModule(name, exports);
	return exports;
};

/**
 * 执行factory，返回模块实例
 * @override
 */
CommonJSPackage.prototype.execute = function(name, context, runtime) {

	// 循环引用
	// 出现循环引用但并不立刻报错，而是当作此模块没有获取到，继续获取下一个
	if (runtime.getStackItem(name)) {
		return null;
	}

	var deps = runtime.loadings[this.id].deps;

	runtime.pushStack(name, this);

	var exports = this.make(name, context, deps, runtime);

	if (name == '__main__' && typeof exports.main == 'function') {
		exports.main();
	}
	runtime.popStack();
	return exports;
};

CommonJSPackage.prototype.toDep = function(i, runtime) {
	var name = this.dependencies[i];
	// object.define中，“.”作为分隔符的被认为是ObjectDependency，其他都是CommenJSDependency
	if (name.indexOf('/') == -1 && name.indexOf('.') != -1) {
		return new ObjectDependency(name, this, runtime);
	} else {
		return new CommonJSDependency(name, this, runtime);
	}
};

/**
 * 生成require
 */
CommonJSPackage.prototype.createRequire = function(name, context, deps, runtime) {
	var loader = runtime.loader;
	var parent = this;
	var parentName = name;
	var parentContext = context;

	function require(name) {
		var index = parent.dependencies.indexOf(name);
		if (index == -1) {
			throw new ModuleRequiredError(name, parent);
		}
		var dep = deps[index];

		var exports = dep.execute(parentName, parentContext);

		if (!exports) {
			// 有依赖却没有获取到，说明是由于循环依赖
			if (parent.dependencies.indexOf(name) != -1) {
				throw new CyclicDependencyError(runtime.stack, loader.lib[dep.id]);
			} else {
				// 出错
				console.warn('Unknown Error.');
			}
		}

		return exports;
	}

	require.async = function(dependencies, callback) {
		// async可表示为一个新的入口，也需要刷新lib
		runtime.loader.buildFileLib();
		// 创建一个同目录package，保证相对依赖的正确
		var id = parent.id + '~' + new Date().getTime() + Math.floor(Math.random() * 100);
		runtime.loader.defineModule(CommonJSPackage, id, dependencies, function(require, exports, module) {
			var args = [];
			module.dependencies.forEach(function(dependency) {
				args.push(require(dependency));
			});
			callback.apply(null, args);
		});
		runtime.loadModule(id, function() {
			var newPkg = runtime.loader.lib[id];
			// 由于newPkg的id与之前的相同，load方法会覆盖掉runtime.loadings上保存的成员
			newPkg.execute(newPkg.id, context, runtime);
		});
	};

	return require;
};

/**
 * 文艺 Package
 */
function ObjectPackage(id, dependencies, factory) {
	Package.apply(this, arguments);
};

ObjectPackage.prototype = new Package();

ObjectPackage.prototype.constructor = ObjectPackage;

ObjectPackage.prototype.make = function(name, context, deps, runtime) {
	var returnExports;
	var args = [];
	var exports;

	// 将所有依赖都执行了，放到参数数组中
	deps.forEach(function(dep) {
		var depExports = dep.execute(name, context);
		if (args.indexOf(depExports) == -1) {
			args.push(depExports);
		}
	}, this); 

	// 自己
	exports = runtime.modules[name];
	if (!exports) {
		exports = new Module(name);
		// 只是暂时存放，为了factory执行时可以通过sys.modules找到自己，有了返回值后，后面需要重新addModule
		runtime.modules[name] = exports;
		runtime.packages[name] = this;
	}

	// 最后再放入exports，否则当错误的自己依赖自己时，会导致少传一个参数
	args.unshift(exports);

	if (this.factory) {
		returnExports = this.factory.apply(exports, args);
	}

	// 当有returnExports时，之前建立的空模块（即exports变量）则没有用武之地了，给出警告。
	if (returnExports) {
		// 检测是否有子模块引用了本模块
		if (exports.__empty_refs__) {
			exports.__empty_refs__.forEach(function(ref) {
				if (typeof console != 'undefined') {
					console.warn(ref + '无法正确获得' + name + '模块的引用。因为该模块是通过return返回模块实例的。');
				}
			});
		}

		returnExports.__name__ = exports.__name__;
		exports = returnExports;
	} else {
		delete exports.__empty_refs__;
	}

	runtime.addModule(name, exports);
	return exports;
};

/**
 * 执行factory，返回模块实例
 * @override
 */
ObjectPackage.prototype.execute = function(name, context, runtime) {
	var exports;
	var parent;
	var deps;

	// 循环引用
 	// 出现循环依赖时建立一个空的exports返回，待所有流程走完后会将此模块填充完整。
	if (runtime.getStackItem(name)) {
		if (!(name in runtime.modules)) {
			runtime.addModule(name, new Module(name));
			runtime.packages[name] = this;
		}
		exports = runtime.modules[name];
		parent = runtime.stack[runtime.stack.length - 1];
		// 在空的exports上建立一个数组，用来存储依赖了此模块的所有模块
		if (!exports.__empty_refs__) {
			exports.__empty_refs__ = [];
		}
		exports.__empty_refs__.push(parent.module.id);

	} else {

		deps = runtime.loadings[this.id].deps;

		runtime.pushStack(name, this);

		exports = this.make(name, context, deps, runtime);

		if (name == '__main__' && typeof exports.main == 'function') {
			exports.main();
		}

		runtime.popStack();
	}

	return exports;
};

ObjectPackage.prototype.toDep = function(index, runtime) {
	var name = this.dependencies[index];
	// object.add中，“/”作为分隔符的被认为是CommonJSDependency，其他都是ObjectDependency
	if (name.indexOf('/') != -1) {
		return new CommonJSDependency(name, this, runtime);
	} else {
		return new ObjectDependency(name, this, runtime);
	}
};

/**
 * XX Package
 */
function Package(id, dependencies, factory) {
	if (!id) return;

	this.id = id;
	this.factory = factory;
	this.dependencies = this.parseDependencies(dependencies);
}

/**
 * 尝试获取此模块的所有依赖模块，全部获取完毕后执行callback
 */
Package.prototype.load = function(runtime, callback) {
	var deps = [];
	var pkg = this;

	var loaded = -1;
	function next() {
		loaded++;
		if (loaded == pkg.dependencies.length) {
			if (callback) {
				callback();
			}
		}
	}

	this.dependencies.forEach(function(dependency, i) {
		var dep = this.toDep(i, runtime);
		deps.push(dep);
		dep.load(next);
	}, this);

	runtime.loadings[this.id].deps = deps;
	// 此时deps已经有了，确保当前pkg是网络加载完毕了，执行之前未执行的callbacks
	runtime.loadings[this.id].callbacks.forEach(function(callback) {
		callback();
	});
	runtime.loadings[this.id].callbacks = [];

	next();
};

/**
 * 获取此package产生的模块的实例
 */
Package.prototype.execute = function(name, context, runtime) {

	if (runtime.getStackItem(name)) {
		throw new CyclicDependencyError(runtime.stack);
	}

	var exports = new Module(name);
	// sys.modules
	if (this.id === 'sys') {
		exports.modules = runtime.modules;
		exports.stack = runtime.stack;
		exports.getModule = function(name) {
			return runtime.packages[name];
		};
	}

	runtime.addModule(name, exports);
	runtime.packages[name] = this;
	return exports;
};

/**
 * 处理传入的dependencies参数
 * 在parseDependencies阶段不需要根据名称判断去重（比如自己use自己），因为并不能避免所有冲突，还有循环引用的问题（比如 core use dom, dom use core）
 * @param {String} dependencies 输入
 */
Package.prototype.parseDependencies = function(dependencies) {
	if (Array.isArray(dependencies)) return dependencies;

	if (!dependencies) {
		return [];
	}

	dependencies = dependencies.trim().replace(/^,*|,*$/g, '').split(/\s*,\s*/ig);

	return dependencies;
};

function Dependency(name, owner, runtime) {
	if (!name) return;
	this.owner = owner;
	this.runtime = runtime;
	this.name = name;
}

/**
 * @param name
 * @param module
 */
function CommonJSDependency(name, owner, runtime) {
	Dependency.apply(this, arguments);

	var loader = runtime.loader;
    var info, id, context;
	var paths = loader.paths;
	var type = this.getType(name);

	// absolute id
	if (type == 'absolute') {
		id = name;
	}
	// relative id
	else if (type == 'relative') {
		info = loader.find(urljoin(urljoin(owner.id, '.'), name), paths);
		id = info.id;
		context = info.context;
	}
	// root id
	else if (type == 'root') {
		id = urljoin(Loader._pageDir, name);
	}
	// top-level id
	else {
		info = loader.find(name, paths);
		id = info.id;
		context = info.context;
	}

	this.id = id;
	this.context = context || '';
	this.type = type;
};

CommonJSDependency.prototype = new Dependency();

/**
 * 获取依赖的路径形式
 * absolute: http://xxx/abc.js
 * relative: ./abc.js
 * root: /abc.js
 * top-level: abc.js
 */
CommonJSDependency.prototype.getType = function(name) {
	if (~name.indexOf('://') || name.indexOf('//') === 0) {
		return 'absolute';
	}
	if (name.indexOf('./') === 0 || name.indexOf('../') === 0) {
		return 'relative';
	}
	if (name.charAt(0) === '/' && name.charAt(1) !== '/') {
		return 'root';
	}
	return 'top-level';
};

CommonJSDependency.prototype.constructor = CommonJSDependency;

CommonJSDependency.prototype.load = function(callback) {
	this.runtime.loadModule(this.id, callback);
};

CommonJSDependency.prototype.execute = function(parentName, parentContext) {
	var runtime = this.runtime;
	var loader = runtime.loader;
	var runtimeName;

	if (this.type == 'top-level') {
		runtimeName = this.name;

	} else if (this.type == 'relative') {
		runtimeName = this.id.slice(parentContext.length);

	} else {
		runtimeName = this.id;
	}

	// CommonJSDependency生成的name不能有.js后缀，以保持和ObjectDependency的name兼容
	// 同时，统一标准才能保证使用不同方法依赖时缓存有效
	// 比如依赖 ui.js 和 ui，若不删除扩展名会被当成两个模块导致缓存失效
	if (runtimeName.slice(-3) == '.js') {
		runtimeName = runtimeName.slice(0, -3);
	}

	var exports = runtime.modules[runtimeName];
	var pkg, deps;
	if (!exports) {
		pkg = loader.lib[this.id];
		exports = pkg.execute(runtimeName, this.context, runtime);
	}
	return exports;
};

/**
 * @param name
 * @param owner
 * @param runtime
 */
function ObjectDependency(name, owner, runtime) {
	Dependency.apply(this, arguments);

	var loader = runtime.loader;
	// 需要搜索的所有路径，runtime.moduleId是内置默认的
	var paths = runtime.path.concat([runtime.moduleId]);
	// 此依赖是否是在父模块当前目录中找到的，用于声称其name
	var isRelative = false;

	// 分别在以下空间中找：
	// 当前模块(sys.path中通过'.'定义)；
	// 全局模块(sys.path中通过'/'定义)；
	// 运行时路径上的模块(默认的)。
	var info = loader.find(name.replace(/\./g, '/'), paths, owner.id);
	var id = info.id;
	// context为id的前缀部分
	var context = info.context;
	if (context == '') {
		isRelative = true;
		context = urljoin(urljoin(owner.id, '.'), context);
	}

	// 当一个名为 a/b/c/d/e/f/g 的模块被 a/b/c/d/e/ 在 a/b/c 运行空间下通过 f.g 依赖时：
	// runtime.context: a/b/c
	// dep->name: f.g
	// dep->id: a/b/c/d/e/f/g

	// 当一个名为 a/b/c/d/e/f/g 的模块被 a/b/c/d/e/ 在 xxx/xxx 运行空间下通过 f.g 依赖时：
	// runtime.context: xxx/xxx
	// dep->name: f.g
	// dep->id: a/b/c/d/e/f/g

	// 模块name
	this.nameParts = this.name.split('.');
	// 完整模块id
	this.id = id;
	// id的前缀
	this.context = context;
	// 是否是相对依赖模块
	this.isRelative = isRelative;
};

ObjectDependency.prototype = new Dependency();

ObjectDependency.prototype.constructor = ObjectDependency;

ObjectDependency.prototype.load = function(callback) {
	var runtime = this.runtime;
	var loader = runtime.loader;
	var parts = this.nameParts;

	var loaded = -1;
	function next() {
		loaded++;
		if (loaded == parts.length) {
			if (callback) callback();
		}
	}

	/**
	 * 依次获取当前模块的每个部分
	 * 如a.b.c，依次获取a、a.b、a.b.c
	 */
	parts.forEach(function(part, i) {
		var id, info;

		if (i == parts.length - 1) {
			id = this.id;
		} else {
			// 先用最短的名字查找，确保能找到所有的可能
			info = loader.find(urljoin(this.context, parts.slice(0, i + 1).join('/')));
			id = info.id;
			// 没找到，用最后才能查找到的文件名生成临时模块，确保后续手工定义的模块能够在临时模块前被找到。
			if (!info.found) {
				id = id + '/index.js';
				loader.definePrefix(id);
			}
		}
		runtime.loadModule(id, next);
	}, this);

	next();
};

ObjectDependency.prototype.execute = function(parentName, parentContext) {
	var dep = this;
	var runtime = this.runtime;
	var loader = runtime.loader;
	var context = this.context || '';
	var parts = this.nameParts;
	// prefix 为name的前缀，通过父name获得
	var prefix, point;
	if (this.isRelative) {
		point = parentName.lastIndexOf('.');
		if (point == -1) {
			prefix = '';
		} else {
			prefix = parentName.slice(0, point);
		}
	} else {
		prefix = '';
	}
	var pName = prefix;
	var name;

	var rootName = (prefix? prefix + '.' : '') + parts[0];
	var id, pkg, exports;

	/**
	 * 依次获取当前模块的每个部分
	 * 如a.b.c，依次获取a、a.b、a.b.c
	 */
	for (var i = 0, l = parts.length, part; i < l; i++) {
		part = parts[i];

		name = (pName? pName + '.' : '') + part;

		if (!(name in runtime.modules)) {
			if (i == parts.length - 1) {
				id = dep.id;
			} else {
				id = loader.find(urljoin(context, parts.slice(0, i + 1).join('/'))).id;
			}
			pkg = loader.lib[id];
			exports = pkg.execute(name, context, runtime);
			runtime.setMemberTo(pName, part, exports);
		}
		pName = name;
	}

	return runtime.modules[rootName];

};

/**
 * Loader运行时，每一个use、execute产生一个
 */
function LoaderRuntime(moduleId) {

	/**
	 * 此次use运行过程中用到的所有module
	 */
	this.modules = {};

	/**
	 * 此次use运行过程中用到的所有package
	 */
	this.packages = {};

	/**
	 * load阶段所有模块的集合
	 */
	this.loadings = {};

	/**
	 * 模块的依赖路径的栈，检测循环依赖
	 */
	this.stack = [];

	/**
	 * 当使用相对依赖时，子模块被处理完毕时，其父模块可能还未处理完毕
	 * 导致无法立刻将此子模块的引用赋予其父模块
	 * 此变量用于存储父模块与其子模块的映射关系，在父模块初始化完毕后再将自模块赋予自己。
	 */
	this.members = {};
	
	/**
	 * 运行入口模块的路径
	 */
	this.moduleId = moduleId;

	/**
	 * sys.path，在创建实例时应该同loader.paths合并
	 */
	this.path = [''];
}

/**
 * 加入一个module
 */
LoaderRuntime.prototype.addModule = function(name, exports) {
	exports = exports || new Module(name);
	this.modules[name] = exports;

	// 已获取到了此host的引用，将其子模块都注册上去。
	var members = this.members[name];
	if (members) {
		members.forEach(function(member) {
			this.modules[name][member.id] = member.value;
		}, this);
	}

	return exports;
};

LoaderRuntime.prototype.loadModule = function(id, callback) {
	var runtime = this;
	var loader = this.loader;

	// 说明之前已经触发过load了
	if (id in this.loadings) {
		// 已经加载完成，有deps了，直接返回
		if (this.loadings[id].deps) {
			callback();
		}
		// 还在加载中，将callback存储起来
		else {
			this.loadings[id].callbacks.push(callback);
		}
		return;
	}

	this.loadings[id] = {
		deps: null,
		callbacks: []
	};

	var pkg = loader.lib[id];

	if (!pkg) {
		throw new NoModuleError(id);
	}

	function fileDone() {
		var id = pkg.id;
		var file = pkg.file;
		// 重新读取pkg，之前的pkg只是个占位
		pkg = loader.lib[id];

		// 加载进来的脚本没有替换掉相应的模块，文件有问题。
		if (!pkg || !pkg.factory) {
			throw new Error(file + ' do not add ' + id);
		}
		pkg.load(runtime, callback);
	}

	// file
	if (pkg.file) {
		Loader.loadScript(pkg.file, fileDone, true);

	// Already define
	} else {
		pkg.load(this, callback);
	}
};

LoaderRuntime.prototype.getStackItem = function(id) {
	var result;
	this.stack.some(function(m) {
		if (m.id == id) {
			result = m;
			return true;
		}
	});
	return result;
};

LoaderRuntime.prototype.pushStack = function(id, pkg) {
	this.stack.push({
		id: id,
		module: pkg
	});
};

LoaderRuntime.prototype.popStack = function() {
	this.stack.pop();
};

/**
 * 为名为host的module设置member成员为value
 */
LoaderRuntime.prototype.setMemberTo = function(host, member, value) {

	// 向host添加member成员
	if (host) {
		// 已存在host
		if (this.modules[host]) {
			this.modules[host][member] = value;
		}
		// host不存在，记录在members对象中
		else {
			if (!this.members[host]) this.members[host] = [];
			this.members[host].push({
				id: member,
				value: value
			});
		}
	}
};

/**
 * object的包管理器
 */
function Loader(base) {
	this.useCache = true;
	this.anonymousModuleCount = 0;
	this.base = base || '/'; // base必须只读
	this.lib = {};
	this.paths = [this.base]; // CommonJSDependency从这里获取paths

	this.scripts = document.getElementsByTagName('script');

	this.lib['sys'] = new Package('sys');
}

// 用于保存url与script节点的键值对
Loader._urlNodeMap = {};

// global pageDir
Loader._pageDir = null;

/**
 * 通过一个src，获取对应文件的绝对路径
 * 例如：http://hg.xnimg.cn/a.js -> http://hg.xnimg.cn/a.js
 *       file:///dir/a.js -> file:///dir/a.js
 *       in http://host/b/c/d/e/f.html, load ../g.js -> http://host/a/b/d/g.js
 *       in file:///dir/b/c/d/e/f.html, load ../g.js -> file:///dir/a/b/d/g.js
 *
 * @param src 地址
 */
Loader.getAbsolutePath = function(src) {

	// 如果本身是绝对路径，则返回src的清理版本
	if (src.indexOf('://') != -1 || src.indexOf('//') === 0) {
		return cleanPath(src);
	}

	if (!Loader._pageDir) {
		Loader._pageDir = calculatePageDir();
	}
	return cleanPath(Loader._pageDir + src);
};

/**
 * 将name中的“.”换成id形式的“/”
 * @param name
 * @param withExt 确保扩展名为.js
 */
Loader.prototype.name2id = function(name, withExt) {
	if (typeof name != 'string') return '';

	var id, ext, extdot;

	if (name.indexOf('/') == -1) {
		id = name.replace(/\./g, '/');
	} else {
		id = name;
	}

	// name有可能是个目录
	if (withExt && name.lastIndexOf('/') != name.length - 1) {
		extdot = id.lastIndexOf('.');
		if (extdot != -1) {
			ext = id.slice(extdot);
		} else {
			ext = '';
		}

		if (!ext) {
			id += '.js';
		}
	}

	return id;
};

/**
 * 从paths中寻找符合此id的模块
 * @param id
 * @param paths
 * @param base
 */
Loader.prototype.find = function(id, paths, base) {
	var loader = this;
	var ext = id.slice(id.lastIndexOf('.'));

	if (!paths) {
		paths = this.paths;
	}

	var foundId = null;
	var foundContext = null;

	// 尝试查找不同的扩展名
	function find(id) {
		var pkg;

		if (pkg = loader.lib[id] || loader.lib[id + '.js'] || loader.lib[id + '/index.js']) {
			return pkg.id;
		}
	}

	// 尝试在path中查找
	function findIn(path) {
		var tempId = find(urljoin(urljoin(base, path), id));
		if (tempId) {
			foundId = tempId;
			foundContext = path;
			return true;
		}
	};

	paths.some(findIn);

	return {
		found: !!foundId,
		id: foundId || id,
		context: foundContext
	};
};

/**
 * 查找页面中的标记script标签，更新lib
 */
Loader.prototype.buildFileLib = function() {

	var scripts = this.scripts;

	for (var i = 0, script, names, src, l = scripts.length; i < l; i++) {
		script = scripts[i];
		src = script.getAttribute('data-src');
		names = script.getAttribute('data-module');
		if (!names || !src) continue;
		names.trim().split(/\s+/ig).forEach(function(name) {
			this.defineFile(urljoin(this.base, this.name2id(name, true)), src);
		}, this);
	}
};

/**
 * 加载一个script, 执行callback
 * 有冲突检测，如果连续调用两次loadScript同一src的话，则第二个调用会等第一个完毕后直接执行callback，不会加载两次。
 *
 * @param src 地址
 * @param callback callback函数
 */
Loader.loadScript = function(src, callback, useCache) {
	if (!src || typeof src != 'string') {
		throw new Error('bad arguments.');
	}
	src = src.trim();
	var absPath = Loader.getAbsolutePath(src);
	if (useCache) {
		var urlNodeMap = Loader._urlNodeMap, scriptNode = urlNodeMap[absPath];
		if (scriptNode) {
			if (scriptNode.loading) {
				// 增加一个回调即可
				scriptNode.callbacks.push(callback);
			} else {
				callback(scriptNode);
			}
			return;
		}
	}

	var ele = document.createElement('script');
	ele.type = "text/javascript";
	ele.src = src;
	ele.async = true;
	ele.loading = true;
	ele.callbacks = [];

	var doCallback = function() {
		ele.loading = null;
		ele.callbacks.forEach(function(callback) {
			callback(ele);
		});
		for (var i = 0, l = ele.callbacks.length; i < l; i++) {
			ele.callbacks[i] = null;
		}
		ele.callbacks = null;
	};

	ele.callbacks.push(callback);

	if (window.ActiveXObject) { // IE
		ele.onreadystatechange = function() {
			var rs = this.readyState;
			if ('loaded' === rs || 'complete' === rs) {
				ele.onreadystatechange = null;
				doCallback();
			}
		};

	} else if (ele.addEventListener) { // Standard
		ele.addEventListener('load', doCallback, false);
		ele.addEventListener('error', doCallback, false);

	} else { // Old browser
		ele.onload = ele.onerror = doCallback;
	}

	document.getElementsByTagName('head')[0].insertBefore(ele, null);

	if (useCache) { 
		// 利用绝对路径来存键值对，key为绝对路径，value为script节点
		urlNodeMap[absPath] = ele;
	}
};

/**
 * 根据src属性，删除一个script标签，并且清除对应的键值对缓存记录
 * @param src 路径
 */
Loader.prototype.removeScript = function(src) {
	if (!src || typeof src != 'string') {
		throw new Error('bad arguments.');
	}
	src = src.trim();
	// 转换为绝对路径
	var absPath = Loader.getAbsolutePath(src);
	// 获取节点
	var urlNodeMap = Loader._urlNodeMap, scriptNode = urlNodeMap[absPath];
	// 如果节点存在，则删除script，并从缓存中清空
	if (scriptNode) {
		delete urlNodeMap[absPath];
		if (scriptNode.parentNode) {
			scriptNode.parentNode.removeChild(scriptNode);
		}
		scriptNode = null;
	}
};

/**
 * 建立一个runtime
 */
Loader.prototype.createRuntime = function(id) {
	var runtime = new LoaderRuntime(id);
	runtime.loader = this;
	runtime.path = runtime.path.concat(this.paths);
	return runtime;
};

/**
 * 定义一个prefix module
 */
Loader.prototype.definePrefix = function(id) {
	if (!id || typeof id != 'string') return;

	// 只要存在就返回
	if (id in this.lib) return;

	this.lib[id] = new Package(id);
};

/**
 * 定义一个file module，供异步加载
 */
Loader.prototype.defineFile = function(id, src) {
	if (!id || typeof id != 'string') return;

	// 存在factory或file则返回
	if (id in this.lib && (this.lib[id].factory || this.lib[id].file)) return;

	var pkg = new Package(id);
	pkg.file = src;
	this.lib[id] = pkg;
};

/**
 * 定义一个普通module
 */
Loader.prototype.defineModule = function(constructor, id, dependencies, factory) {
	if (arguments.length < 4) return;

	// 不允许重复添加
	if (id in this.lib && this.lib[id].factory) return;

	var pkg = new constructor(id, dependencies, factory);
	this.lib[id] = pkg;
};

/**
 * @param name
 */
Loader.prototype.getModule = function(name) {
	var id = this.find(this.name2id(name)).id;
	if (id in this.lib) return this.lib[id];
	return null;
};

/**
 * @param name
 * @param dependencies
 * @param factory
 */
Loader.prototype.define = function(name, dependencies, factory) {
	if (typeof name != 'string') return;

	if (typeof dependencies == 'function') {
		factory = dependencies;
		dependencies = [];
	}

	var id = urljoin(this.base, this.name2id(name, true));
	this.defineModule(CommonJSPackage, id, dependencies, factory);
};

/**
 * @param name
 * @param dependencies
 * @param factory
 */
Loader.prototype.add = function(name, dependencies, factory) {
	if (typeof name != 'string') return;

	if (typeof dependencies == 'function') {
		factory = dependencies;
		dependencies = [];
	}

	var id = urljoin(this.base, this.name2id(name, true));
	this.defineModule(ObjectPackage, id, dependencies, factory);
};

/**
 * 移除模块的定义
 * @param name 需要移除模块的name
 * @param all 是否移除其所有子模块
 */
Loader.prototype.remove = function(name, all) {
	var id = urljoin(this.base, this.name2id(name, true));

	delete this.lib[id];

	// 只有目录才可能递归删除
	if (all) {
		// 确保all时是个目录
		name = name.charAt(name.length - 1) == '/'? name : name + '/';
		id = urljoin(this.base, this.name2id(name));
		Object.keys(this.lib).forEach(function(key) {
			if (key.indexOf(id) == 0) {
				delete this.lib[key];
			}
		}, this);
	}
};


/**
 * 清空模块
 */
Loader.prototype.clear = function() {
	for (var prop in this.lib) {
		if (prop != 'sys') {
			this.remove(prop);
		}
	}
};

/**
 * execute
 * @param name 执行的入口模块名称
 */ 
Loader.prototype.execute = function(name) {
	if (!name || typeof name != 'string') {
		return;
	}
	this.buildFileLib();

	var info = this.find(this.name2id(name));
	var id = info.id;
	var context = info.context;

	var runtime = this.createRuntime(id, context);
	object.runtime = runtime;
	runtime.loadModule(id, function() {
		var pkg = runtime.loader.lib[id];
		pkg.execute('__main__', context, runtime);
	});
	object.runtime = null;
};

/**
 * use
 * @param dependencies 用逗号分隔开的模块名称列表
 * @param factory dependencies加载后调用，将module通过参数传入factory，第一个参数为exports，后面的参数为每个module的不重复引用，顺序排列
 */
Loader.prototype.use = function(dependencies, factory) {
	if (!factory || typeof factory != 'function') {
		return;
	}
	this.buildFileLib();

	var id = '__anonymous_' + this.anonymousModuleCount + '__';
	this.anonymousModuleCount++;

	this.defineModule(CommonJSPackage, id, dependencies, function(require, exports, module) {
		var args = [];
		module.dependencies.forEach(function(dependency) {
			dep = require(dependency);
			if (args.indexOf(dep) == -1) {
				args.push(dep);
			}
		});

		if (factory.length == args.length + 1) {
			if (typeof console != 'undefined') {
				console.warn('object.use即将不再支持第一个exports参数，请尽快删除。');
			}
			args.unshift(exports);
		}
		factory.apply(null, args);
	});

	var runtime = this.createRuntime(id);

	object.runtime = runtime;
	runtime.loadModule(id, function() {
		var pkg = runtime.loader.lib[id];
		pkg.execute('__main__', '', runtime);
	});
	object.runtime = null;
};

object.Loader = Loader;
object.NoModuleError = NoModuleError;
object.ModuleRequiredError = ModuleRequiredError;

})(object);
/**
 * 创建object的loader
 */
;(function(object) {

var loader = new object.Loader('http://pub.objectjs.org/object/');

object._loader = loader;

object.add = loader.add.bind(loader);
object.define = loader.define.bind(loader);
object.remove = loader.remove.bind(loader);
object.use = loader.use.bind(loader);
object.execute = loader.execute.bind(loader);
object.addPath = function(path) {
	loader.paths.push(path);
};

/**
 * 增加window模块，如果其他模块中需要使用或修改window的相关内容，必须显式的依赖window模块
 */
object.define('./window.js', 'sys', function(require) {
	var sys = require('sys');
	var dom = sys.modules['dom'];
	if (dom) dom.wrap(window);
	return window;
});

object.define('./loader.js', function(require, exports) {
	exports.Loader = object.Loader;
});

})(object);
object.add('ua/index.js', function(exports) {

	/**
	 * 将字符串转化为数字的方法
	 *
	 * @param s 带转化的字符串
	 */
	var numberify = this.numberify = function(s) {
		if(!s || typeof s != 'string') {
		
		}
		var c = 0;
		// convert '1.2.3.4' to 1.234
		return parseFloat(s.replace(/\./g, function() {
			return (c++ === 0) ? '.' : '';
		}));
	};

	//将方法挂接在ua模块上，便于单元测试
	this.__detectUA = detectUA;

	this.ua = {};
	var o = detectUA(navigator.userAgent);
	object.extend(this.ua, o);

	/**
	 * 检测浏览器内核和版本的主方法
	 */
	function detectUA(ua) {
		if(!ua && typeof ua != 'string') {
			ua = navigator.userAgent;
		}
		var m, m2;
		var o = {}, core, shell;

		// check IE
		if (!~ua.indexOf('Opera') && (m = ua.match(/MSIE\s([^;]*)/)) && m[1]) {

			// IE8: always IE8, with Trident 4
			// IE9: same as documentMode, with Trident 5
			// IE10: same as documentMode, with Trident 6
			if ((m2 = ua.match(/Trident\/([\d\.]*)/)) && m2[1]) {
				o[core = 'ie'] = document.documentMode;
				o[shell = 'ieshell'] = numberify(m2[1]) + 4;
			// IE6
			// IE7
			} else {
				o[shell = 'ieshell'] = o[core = 'ie'] = numberify(m[1]);
			}

		} else {

			// check core

			// Webkit
			if ((m = ua.match(/AppleWebKit\/([\d\.]*)/)) && m[1]) {
				o[core = 'webkit'] = numberify(m[1]);

			// Gecko
			// 避免Opera userAgent：Mozilla/5.0 (Windows NT 5.1; U; en; rv:1.8.1) Gecko/20061208 Firefox/5.0 Opera 11.11
			} else if (!~ua.indexOf('Opera') && (m = ua.match(/Gecko/))) {
				o[core = 'gecko'] = 0; // Gecko detected, look for revision
				if ((m = ua.match(/rv:([\d\.]*)/)) && m[1]) {
					o[core] = numberify(m[1]);
				}

			// Presto
			// ref: http://www.useragentstring.com/pages/useragentstring.php
			} else if ((m = ua.match(/Presto\/([\d\.]*)/)) && m[1]) {
				o[core = 'presto'] = numberify(m[1]);
			}

			// check shell

			// Chrome
			if ((m = ua.match(/Chrome\/([\d\.]*)/)) && m[1]) {
				o[shell = 'chrome'] = numberify(m[1]);

			// Safari
			} else if ((m = ua.match(/\/([\d\.]*)( Mobile\/?[\w]*)? Safari/)) && m[1]) {
				o[shell = 'safari'] = numberify(m[1]);
			} else if (/\/[\d\.]* \(KHTML, like Gecko\) Safari/.test(ua)) {
				o[shell = 'safari'] = undefined;

			// Firefox
			// 避免Opera userAgent：Mozilla/5.0 (Windows NT 5.1; U; en; rv:1.8.1) Gecko/20061208 Firefox/5.0 Opera 11.11
			} else if (!~ua.indexOf('Opera') && (m = ua.match(/Firefox\/([\d\.]*)/)) && m[1]) {
				o[shell = 'firefox'] = numberify(m[1]);

			// Opera
			} else if ((m = ua.match(/Opera\/([\d\.]*)/)) && m[1]) {
				o[shell = 'opera'] = numberify(m[1]); // Opera detected, look for revision

				if ((m = ua.match(/Opera\/.* Version\/([\d\.]*)/)) && m[1]) {
					o[shell] = numberify(m[1]);
				}
			} else if ((m = ua.match(/Opera ([\d\.]*)/)) && m[1]) {
				core = 'presto';
				o[shell = 'opera'] = numberify(m[1]);
			}
		}

		o.shell = shell;
		o.core = core;
		return o;
	}
});

object.add('./string.js', function(exports) {

/**
 * 模板
 */
this.substitute = function() {
	return Mustache.to_html.apply(null, arguments);
};

/**
* 转换为驼峰式
*/
this.camelCase = function(str) {
	return str.replace(/-\D/g, function(match){
		return match.charAt(1).toUpperCase();
	});
};

/**
* 转换为减号(-)分隔式
*/
this.hyphenate = function(str) {
	return str.replace(/[A-Z]/g, function(match){
		return ('-' + match.charAt(0).toLowerCase());
	});
};

/**
* 转换为首字母大写
*/
this.capitalize = function(str) {
	return str.replace(/\b[a-z]/g, function(match){
		return match.toUpperCase();
	});
};

/**
* 清空字符串左右两端的空白
*/
this.trim = function(str) {
	return (str || '').replace(/^\s+|\s+$/g, '');
};

/**
* 清空字符串左端的空白
*/
this.ltrim = function(str) {
	return (str || '').replace(/^\s+/ , '');
};

/**
* 清空字符串右端的空白
*/
this.rtrim = function(str) {
	return (str || '').replace(/\s+$/ , '');
};

/**
* 字符长度（包含中文）
*/
this.lengthZh = function(str) {
	return str.length;
};

/**
 * 将对象转换为querystring
 * 来自 mootools
 */
this.toQueryString = function(object) {
	var queryString = [];

	for (var key in object) {
		var value = object[key];

		var result;

		if (value && value.constructor === Array) {
			var qs = {};
			value.forEach(function(val, i) {
				qs[i] = val;
			});

			result = arguments.callee(qs, key);
		} else if (typeof value == 'object') {
			result = arguments.callee(value, key);
		} else {
			result = key + '=' + encodeURIComponent(value);
		}

		if (value !== null) queryString.push(result);
	}

	return queryString.join('&');
};

});
object.define('./events.js', 'ua', function(require, exports) {

var ua = require('ua');

/**
 * 在Safari3.0(Webkit 523)下，preventDefault()无法获取事件是否被preventDefault的信息
 * 这里通过一个事件的preventDefault来判断类似情况
 * _needWrapPreventDefault用于在wrapPreventDefault中进行判断
 */
var _needWrapPreventDefault = (function() {
	if (document.createEvent) {
		var event = document.createEvent('Event');
		event.initEvent(type, false, true);

		if (event.preventDefault) {
			event.preventDefault();
			// preventDefault以后返回不了正确的结果
			return !(event.getPreventDefault? event.getPreventDefault() : event.defaultPrevented);
		} 
		// 没有preventDefault方法，则必然要wrap
		else {
			return true;
		}
	}
	return false;
})();

function IEEvent() {

}
IEEvent.prototype.stopPropagation = function() {
	this.cancelBubble = true;
};

IEEvent.prototype.preventDefault = function() {
	this.returnValue = false;
};

IEEvent.prototype.getPreventDefault = function() {
	// 自定义事件是没有 returnValue 值的，如果设置默认为true，则会导致非自定义的事件后面再设置false失效，出现无法preventDefault()的问题
	// 不能设置默认值，就只能严格限制returnValue === false才算preventDefaulted
	return this.returnValue === false;
};

IEEvent.prototype.stop = function() {
	this.stopPropagation();
	this.preventDefault();
};

/**
 * decorator
 * 使得相应方法在调用时fire出同名事件，并支持preventDefault
 * fireevent 或 fireevent(eventName)
 * fireevent 默认eventName通过__name__获得
 */
this.fireevent = function(arg1) {
	var name, func, eventDataNames;

	var firer = function(self) {
		// 获取function原生name似乎没什么用
		// var nativeName = Function.__get_name__(arguments.callee) || arguments.callee.__name__;
		var nativeName = arguments.callee.__name__;
		if (!name) name = nativeName;

		// 根据eventDataNames生成eventData，每一个参数对应一个eventData
		var eventData = {};
		// 保存func被调用时的所有参数（除了self）
		var args = Array.prototype.slice.call(arguments, 1);
		if (eventDataNames) {
			for (var i = 0; i < eventDataNames.length; i++) {
				// 名字对应方法的参数，从第2个参数开始，因为第一个是self
				eventData[eventDataNames[i]] = arguments[i + 1];
			}
		}
		// 默认有一个_args的data，
		eventData._args = args;

		var event = self.fireEvent(name, eventData, self);

		// 执行 xxx_createEvent 方法，可用于定制event
		var createEventMethod = self[nativeName + '_createEvent'];
		if (createEventMethod) {
			args.unshift(event);
			createEventMethod.apply(self, args);
		}

		// Webkit 使用 defaultPrevented
		// Gecko 使用 getPreventDefault()
		// IE 用 returnValue 模拟了 getPreventDefault
		var preventDefaulted = event.getPreventDefault? event.getPreventDefault() : event.defaultPrevented;
		if (!preventDefaulted) return func.apply(this, arguments);
	};

	if (typeof arg1 == 'function') {
		func = arg1;
		return firer;

	// 自定义了事件名称，返回一个decorator
	} else {
		if (Array.isArray(arguments[0])) {
			eventDataNames = arguments[0];
		} else {
			name = arg1;
			if (arguments[1]) eventDataNames = arguments[1];
		}
		return function(_func) {
			func = _func;
			return firer;
		};
	}

};

/** 
 * addEvent和removeEvent的第三个参数有特殊意义：
 * 第0位：捕获阶段与冒泡阶段的标志，1为捕获阶段，0为冒泡阶段
 * 第1位：事件是否锁定的标志，1为锁定不允许清除，0为可以清除
 */
/** 是否不允许移除事件的标志位 */
this.HOLD = 2;
/** 事件处理函数是否是捕获阶段的标志位 */
this.CAPTURE = 1;

/**
 * 将IE中的window.event包装一下
 */
this.wrapEvent = function(e) {
	// 之前手贱在这里写了个 e.returnValue = true
	// 于是所有的事件都无法阻止执行了
	// IE可能只认第一次赋值，因为后面还是有重新把returnValue设置成false的

	e.target = e.srcElement;
	e.stopPropagation = IEEvent.prototype.stopPropagation;
	e.preventDefault = IEEvent.prototype.preventDefault;
	e.getPreventDefault = IEEvent.prototype.getPreventDefault;
	e.stop = IEEvent.prototype.stop;

	return e;
};

/**
 * safari 3.0在preventDefault执行以后，defaultPrevented为undefined，此处包装一下
 */
this.wrapPreventDefault = function(e) {
	if (_needWrapPreventDefault) {
		var oldPreventDefault = e.preventDefault;
		e.preventDefault = function() {
			this.defaultPrevented = true;
			oldPreventDefault.apply(this, arguments);
		}
	}
}

// native events from Mootools
var NATIVE_EVENTS = {
	click: 2, dblclick: 2, mouseup: 2, mousedown: 2, contextmenu: 2, //mouse buttons
	mousewheel: 2, DOMMouseScroll: 2, //mouse wheel
	mouseover: 2, mouseout: 2, mousemove: 2, selectstart: 2, selectend: 2, //mouse movement
	keydown: 2, keypress: 2, keyup: 2, //keyboard
	orientationchange: 2, // mobile
	touchstart: 2, touchmove: 2, touchend: 2, touchcancel: 2, // touch
	gesturestart: 2, gesturechange: 2, gestureend: 2, // gesture
	focus: 2, blur: 2, change: 2, reset: 2, select: 2, submit: 2, paste: 2, oninput: 2, //form elements
	load: 2, unload: 1, beforeunload: 2, resize: 1, move: 1, DOMContentLoaded: 1, readystatechange: 1, //window
	error: 1, abort: 1, scroll: 1 //misc
};

/**
 * 判断某一个nativeEvent是不是适合Node
 * 在IE下，如果Node不支持nativeEvent类型的事件监听，则nativeFireEvent.call(node, eventName, event)会报错
 * 目前每一种Node支持的类型都已经在dom模块中进行了指定，详情请参见src/dom/index.js中元素的nativeEventNames属性
 */
function isNativeEventForNode(node, type) {
	// 如果有nativeEventNames属性，说明是包装过的元素
	if (node.nativeEventNames) {
		// 判断此节点是否支持此事件类型的触发
		return node.nativeEventNames.indexOf(type) != -1;
	}
	// 如果没有包装过，则继续按照默认的进行（可能会有错误发生）
	return type in NATIVE_EVENTS;
}

/**
 * 事件系统
 */
this.Events = new Class(function() {
	
	/**
	 * 在标准浏览器中使用的是系统事件系统，无法保证nativeEvents在事件最后执行。
     * 需在每次addEvent时，都将nativeEvents的事件删除再添加，保证在事件队列最后，最后才执行。
	 *
	 * @param type 事件类型
	 */
	function moveNativeEventsToTail(self, type) {
		var boss = self.__boss || self;
		if (self.__nativeEvents && self.__nativeEvents[type]) {
			// 删除之前加入的
			boss.removeEventListener(type, self.__nativeEvents[type].run, false);
			// 重新添加到最后
			boss.addEventListener(type, self.__nativeEvents[type].run, false);
		}
	};

	/**
	 * IE下处理事件执行顺序
	 */
	function handle(self, type) {
		var boss = self.__boss || self;
		boss.attachEvent('on' + type, function(event) {
			event = exports.wrapEvent(event || window.event);
			var funcs = self.__eventListeners? self.__eventListeners[type] : null;
			if (funcs) {
				funcs = funcs.slice(0);
				funcs.forEach(function(func) {
					try {
						func.call(self, event);
					} catch(e) {
						handleEventErrorForIE(e);
					}
				});
				funcs = null;
			}
			var natives = self.__nativeEvents? self.__nativeEvents[type] : null;
			if (natives) {
				natives = natives.slice(0);
				natives.forEach(function(func) {
					func.call(self, event);
				});
				natives = null;
			}
		});
	}

	/**
	 * 不同浏览器对onhandler的执行顺序不一样
	 * 	  IE：最先执行onhandler，其次再执行其他监听函数
	 * 	  Firefox：如果添加多个onhandler，则第一次添加的位置为执行的位置
	 * 	  Chrome ：如果添加多个onhandler，最后一次添加的位置为执行的位置
	 * 
	 * Chrome的做法是符合标准的，因此在模拟事件执行时按照Chrome的顺序来进行
	 *
	 * 保证onxxx监听函数的正常执行，并维持onxxx类型的事件监听函数的执行顺序
	 *
	 * @param type 事件类型
	 */
	function addOnHandlerAsEventListener(self, type) {
		// 只有DOM节点的标准事件，才会由浏览器来执行标准方法
		if (type in NATIVE_EVENTS && self.nodeType == 1) return;
		var typeLower = typeof type == 'string' ? type.toLowerCase() : type;

		var boss = self.__boss || self;
		var onhandler = self['on' + typeLower], onhandlerBak = boss['__on' + typeLower];
		// 如果onHandler为空，并且已经添加过，则需要remove
		if (!onhandler && onhandlerBak) {
			boss.removeEventListener(type, onhandlerBak, false);
			boss['__on' + typeLower] = null;
		}
		// 如果onHandler不为空，则需要判断是否已经添加过
		else if (onhandler && onhandler != onhandlerBak) {
			// 如果已经添加过，则先去除原先添加的方法，再将新的方法加入，并更新备份信息
			boss.removeEventListener(type, onhandlerBak, false);
			// 将新的事件监听方法加入列表
			boss.addEventListener(type, onhandler, false);
			// 将新的事件监听方法备份
			boss['__on' + typeLower] = onhandler;
		}
	}
	
	/**
	 * IE下保证onxxx事件处理函数正常执行
	 * @param type 事件类型
	 */
	function attachOnHandlerAsEventListener(self, type) {
		// 只有DOM节点的标准事件，并且此标准事件能够在节点上触发，才会由浏览器来执行标准方法
		if (self.nodeType == 1 && isNativeEventForNode(self, type) && isNodeInDOMTree(self)) return;

		var typeLower = typeof type == 'string' ? type.toLowerCase() : type;

		if (!self.__eventListeners) {
			self.__eventListeners = {};
		}
		if (!self.__eventListeners[type]) {
			self.__eventListeners[type] = [];
		}
		var funcs = self.__eventListeners[type];
		var l = funcs.length;
		var onhandler = self['on' + typeLower], onhandlerBak = self['__on' + typeLower];
		// 如果onHandler为空，并且已经添加过，则需要remove
		if (!onhandler && onhandlerBak) {
			for (var i = 0; i < l; i++) {
				if (funcs[i] == onhandlerBak) {
					funcs.splice(i, 1);
					break;
				}
			}
			self['__on' + typeLower] = null;
		}
		// 如果onHandler不为空，则需要判断是否已经添加过
		else if (onhandler && onhandler != onhandlerBak) {
			// 如果已经添加过，则先去除原先添加的方法，再将新的方法加入，并更新备份信息
			for (var i = 0; i < l; i++) {
				if (funcs[i] == onhandlerBak) {
					funcs.splice(i, 1);
					break;
				}
			}
			// 将新的事件监听方法加入列表
			funcs.push(onhandler);
			// 将新的事件监听方法备份
			self['__on' + typeLower] = onhandler;
		}
	}

	/**
	 * 判断节点是否是DOM树中的节点
	 *
	 * 在IE下，如果不是DOM树中的节点，标准事件的onxxx监听不会触发
	 * 因此在fireEvent时需要判断当前节点是否在DOM树中
	 */
	function isNodeInDOMTree(node) {
		if (!node) {
			return false;
		}
		var parent = node.parentNode;
		var top = document.documentElement;
		while (parent) {
			if (parent == top) {
				return true;
			}
			parent = parent.parentNode;
		}
		return false;
	}

	/**
	 * 在preventDefault方法不靠谱的情况下，如果事件由浏览器自动触发，则需要在第一个事件处理函数中将preventDefault覆盖
	 *
	 * 此方法在事件列表最前面（在onxxx之前）添加一个专门处理preventDefault的事件监听函数
	 */
	function insertWrapPreventDefaultHandler(boss, type, cap) {
		if (!boss['__preEventAdded_' + type]) {
			// 标识该事件类型的preventDefault已经包装过了
			boss['__preEventAdded_' + type] = true;
			// 如果有onxxx类型的处理函数，则也暂时去除，待包装函数添加完以后，再添加回去
			if (boss['on' + type]) {
				boss['__on' + type] = boss['on' + type];
				boss['on' + type] = null;
			}
			// 添加事件监听
			boss.addEventListener(type, function(event) {
				exports.wrapPreventDefault(event);
			}, cap);
			// 把onxxx监听函数添加回去
			if (boss['__on' + type]) {
				boss['on' + type] = boss['__on' + type];
				boss['__on' + type] = null;
				try {
					delete boss['__on' + type];
				} catch (e) {}
			}
		}
	}

	// 判断是否有console.error
	var hasConsoleError = typeof console != 'undefined' && console.error;

	// 用于存储错误详细信息，每次使用前清空，避免产生过多的内存垃圾
	var detail = [];

	/**
	 * 处理IE下事件处理函数中的错误，在有console.error的情况下将错误信息打印至控制台
	 * @param {Error} e 错误对象
	 */
	function handleEventErrorForIE(e) {
		if (hasConsoleError) {
			detail.length = 0;
			for(var prop in e) {
				detail.push(prop + ":" + e[prop]);
				detail.push(", ");
			}
			if (detail.length > 0) {
				detail.pop();
			}
			console.error(e, detail.join(""));
		}
	}

	/**
	 * 初始化方法，主要是初始化__eventListener和__nativeEvents以及__boss等属性
	 */
	this.initialize = function(self) {
		if (!self.addEventListener) {
			// 在一些情况下，你不知道传进来的self对象的情况，不要轻易的将其身上的__eventListeners清除掉
			if (!self.__eventListeners) {
				/** 用于存储事件处理函数的对象 */
				self.__eventListeners = {};
			}
			if (!self.__nativeEvents) self.__nativeEvents = {};
		}
		// 自定义事件，用一个隐含div用来触发事件
		if (!self.addEventListener && !self.attachEvent) {
			self.__boss = document.createElement('div');
		}
	};

	/**
	* 添加事件
	* @method
	* @param type 事件名
	* @param func 事件回调
	* @param cap 冒泡
	*/
	this.addEvent = document.addEventListener? function(self, type, func, cap) {
		var boss = self.__boss || self;

		if (cap === null) cap = false;
		// 取二进制的第0位
		cap = !!(cap & exports.CAPTURE);

		// 非IE不支持mouseleave/mouseenter事件
		// 在老base中大量使用了这个事件，支持一下
		if (!ua.ua.ie && type == 'mouseleave') {
			var ismouseleave = function(event, element) {
				var p = event.relatedTarget;
				while ( p && p != element ) try { p = p.parentNode; } catch(error) { p = element; }
				return p !== element;
			};
			var innerFunc = func;
			func = function(event) {
				var p = event.relatedTarget;
				while (p && p != self) try {
					p = p.parentNode;
				} catch (e) {
					p = self;
				}
				if (p !== self && innerFunc) innerFunc.call(self, event);
			};
			func.innerFunc = innerFunc;
			type = 'mouseout';

			// 备份func，以便能够通过innerFunc来删除func
			if (!self.__eventListeners) {
				self.__eventListeners = {};
			}
			if (!self.__eventListeners[type]) {
				self.__eventListeners[type] = [];
			}
			self.__eventListeners[type].push(func);
		}

		// 如果需要包装preventDefault方法，则在事件处理函数最前面添加一个简单的事件监听
		// 该事件监听只负责包装event，使其preventDefault正确执行
		if (_needWrapPreventDefault) {
			insertWrapPreventDefaultHandler(boss, type, cap);
		}

		//处理onxxx类型的事件处理函数
		addOnHandlerAsEventListener(self, type);

		boss.addEventListener(type, func, cap);
		moveNativeEventsToTail(self, type);

	} : function(self, type, func) {
		var boss = self.__boss || self;

		// 存储此元素的事件
		var funcs;
		if (!self.__eventListeners) self.__eventListeners = {};
		if (!self.__eventListeners[type]) {
			funcs = [];
			self.__eventListeners[type] = funcs;
			if (!self.__nativeEvents || !self.__nativeEvents[type]) {
				handle(self, type);
			}
		} else {
			funcs = self.__eventListeners[type];
		}

		// 不允许两次添加同一事件
		if (funcs.some(function(f) {
			return f === func;
		})) return;

		attachOnHandlerAsEventListener(self, type);
		funcs.push(func);

	};

	/**
	* 添加系统事件，保证事件这些事件会在注册事件调用最后被执行
	* @method
	* @param type 事件名
	* @param func 事件回调
	*/
	this.addNativeEvent = document.addEventListener? function(self, type, func) {
		var boss = self.__boss || self;
		if (_needWrapPreventDefault) {
			insertWrapPreventDefaultHandler(boss, type, false);
		}
		var natives;
		if (!self.__nativeEvents) self.__nativeEvents = {};
		if (!self.__nativeEvents[type]) {
			natives = [];
			self.__nativeEvents[type] = natives;
			self.__nativeEvents[type].run = function(event) {
				natives.forEach(function(func) {
					func.call(self, event);
				});
			};
			moveNativeEventsToTail(self, type);
		} else {
			natives = self.__nativeEvents[type];
		}
		natives.push(func);

	} : function(self, type, func) {
		var boss = self.__boss || self;
		var natives;
		if (!self.__nativeEvents) self.__nativeEvents = {};
		if (!self.__nativeEvents[type]) {
			natives = [];
			self.__nativeEvents[type] = natives;
			if (!self.__nativeEvents || !self.__eventListeners[type]) {
				handle(self, type);
			}
		} else {
			natives = self.__nativeEvents[type];
		}

		// 不允许两次添加同一事件
		if (natives.some(function(f) {
			return f === func;
		})) return;

		natives.push(func);
	};

	/**
	* 移除事件
	* @method
	* @param type 事件名
	* @param func 事件回调
	* @param cap 冒泡
	*/
	this.removeEvent = document.removeEventListener? function(self, type, func, cap) {
		var boss = self.__boss || self;
		// 取二进制的第0位
		cap = !!(cap & exports.CAPTURE);

		if (!ua.ua.ie && type == 'mouseleave') {
			type = 'mouseout';
			if (self.__eventListeners && self.__eventListeners[type]) {
				var funcs = self.__eventListeners[type];
				for (var i = 0, current, l = funcs.length; i < l; i++) {
					current = funcs[i];
					if (current.innerFunc === func) {
						boss.removeEventListener(type, current, cap);
						funcs.splice(i, 1);
						break;
					}
				}
			}
		} else {
			boss.removeEventListener(type, func, cap);
		}
	} : function(self, type, func, cap) {
		var boss = self.__boss || self;

		if (!self.__eventListeners) self.__eventListeners = {};
		var funcs = self.__eventListeners[type];
		if (!funcs) return;

		for (var i = 0; i < funcs.length; i++) {
			if (funcs[i] === func) {
				funcs.splice(i, 1); // 将这个function删除
				break;
			}
		}
	};

	/**
	* 触发事件
	* obj.fireEvent('name', {
	* data: 'value'
	* });
	* @method
	* @param type 事件名
	* @param eventData 扩展到event对象上的数据
	*/
	this.fireEvent = document.dispatchEvent? function(self, type, eventData) {
		if (!ua.ua.ie && type == 'mouseleave') {
			type = 'mouseout';
		}
		//fireEvent之前仍然需要检查onxxx类型的事件处理函数
		addOnHandlerAsEventListener(self, type);
		var boss = self.__boss || self;

		var event = document.createEvent('Event');
		event.initEvent(type, false, true);
		object.extend(event, eventData);

		exports.wrapPreventDefault(event);

		// 火狐下通过dispatchEvent触发事件，在事件监听函数中抛出的异常都不会在控制台给出
		// see https://bugzilla.mozilla.org/show_bug.cgi?id=503244
		// see http://code.google.com/p/fbug/issues/detail?id=3016
		boss.dispatchEvent(event);
		return event;
	} : function(self, type, eventData) {
		if (!eventData) eventData = {};

		// 如果是DOM节点的标准事件，并且该事件能够在节点上由浏览器触发，则由浏览器处理onxxx类型的事件处理函数即可
		// see http://js8.in/731.html
		if (self.nodeType == 1 && isNativeEventForNode(self, type)) {
			var event = exports.wrapEvent(document.createEventObject());
			object.extend(event, eventData);

			// 判断节点是否是加入DOM树的节点
			if (isNodeInDOMTree(self)) {
				// 如果节点在放入DOM树之前调用过addEvent，则标准事件的处理函数onxxx将会被备份
				// 如果在备份之后，将节点插入DOM树，此时标准事件会自动调用onxxx，而onxxx已经备份过一次了
				// 所以在fireEvent之前，需要先检查一下列表中是否已经添加过onxxx的备份，如果添加过，需要删除
				var onhandlerBak = self['__on' + type];
				var funcs = self.__eventListeners[type];
				if (onhandlerBak && funcs) {
					for (var i = 0, l = funcs.length; i < l; i++) {
						if (funcs[i] == onhandlerBak) {
							funcs.splice(i, 1);
							break;
						}
					}
					self['__on' + type] = null;
				}

				if (self._oldFireEventInIE) {
					self._oldFireEventInIE('on' + type, event);
					return event;
				} else {
					if (typeof console != 'undefined') {
						console.warn('请使用dom.wrap方法包装对象以添加事件处理函数');
					}
				}
			}
		}

		attachOnHandlerAsEventListener(self, type);
		var event = exports.wrapEvent(eventData);

		var funcs = self.__eventListeners[type];
		if (funcs) {
			funcs = funcs.slice(0);
			for (var i = 0, j = funcs.length; i < j; i++) {
				if (funcs[i]) {
					try {
						funcs[i].call(self, event, true);
					} catch(e) {
						handleEventErrorForIE(e);
					}
				}
			}
			funcs = null;
		}

		var natives = self.__nativeEvents[type];
		if (natives) {
			natives = natives.slice(0);
			natives.forEach(function(func) {
				func.call(self, event);
			});
			natives = null;
		}

		return event;
	};
});

});
object.add('./options.js', function(exports) {

// 仿照 mootools 的overloadSetter，返回一个 key/value 这种形式的function参数的包装，使其支持{key1: value1, key2: value2} 这种形式
var enumerables = true, APslice = Array.prototype.slice;
for (var i in {toString: 1}) enumerables = null;
if (enumerables) enumerables = ['hasOwnProperty', 'valueOf', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'constructor'];
// func有可能是个method，需要支持传递self参数
this.overloadsetter = function(func) {
	return function() {
		var a = arguments[func.length - 2] || null;
		var b = arguments[func.length - 1];
		var passArgs = args = APslice.call(arguments, 0, func.length - 2);

		if (a === null) return this;
		if (typeof a != 'string') {
			for (var k in a) {
				args = passArgs.slice(0); // 复制，否则循环多次参数就越来越多了
				args.push(k);
				args.push(a[k]);
				func.apply(this, args);
			}
			if (enumerables) {
				for (var i = enumerables.length; i > 0; i--) {
					k = enumerables[i];
					if (a.hasOwnProperty(k)) func.call(this, k, a[k]);
				}
			}
		} else {
			args.push(a);
			args.push(b);
			func.apply(this, args);
		}
		return this;
	};
};

/**
 * 这个类辅助这种参数传递方式的实现：
 * callFunc({
 *	param1: someValue1,
 *	param2: someValue2
 * })
 * 在声明函数时，通过：
 * var opts = new ns.Arguments(opts, {
 *	param1: 1,
 *	param2: 2
 * });
 * 来设定默认值，没有设置过默认值的成员不会输出
 */
this.Arguments = new Class(function() {

	/**
	 * @param defaults 默认值列表
	 * @param opts 参数列表
	 */
	this.initialize = function(self, defaults, opts) {
		if (opts == undefined) opts = {};

		var output = {};
		for (var key in defaults) {
			output[key] = (opts[key] != undefined? opts[key] : defaults[key]);
		}
		return output;
	};

});

/**
 * 参数
 */
this.Options = new Class({

	/**
	 * 提供一个实现了 makeOption 接口的“提供者”参数，这样，在 setOption 时会自动根据name获取value，不用手工调用
	 */
	initialize: function(self, provider) {
		if (provider) {
			/** provider */
			self._provider = provider;
		}
		/** 用于保存所有的选项 */
		self._options = {};
	},

	/**
	 * 设置options属性
	 */
	setOptions: function(self, options, host) {
		if (!host) host = self._options;

		for (var i in options) {
			// host[i] !== undefined is false when the value is undefined
			if (i in host) host[i] = options[i];
		}
	},

	/**
	 * 设置一个option
	 */
	setOption: function(self, name, type, value) {
		if (value !== undefined) {
			self._options[name] = value;
		} else if (self._provider && self._provider.makeOption){
			value = self._provider.makeOption(name, type);
			if (value === null) return;
			else self._options[name] = value;
		}
	},

	/**
	 * 获取options
	 */
	getOptions: function(self) {
		return self._options;
	}

});

});

object.define('dom/index.js', 'ua, events, string, ./dd, net', function(require, exports, module) {

var ua = require('ua');
var events = require('events');
var string = require('string');
var dd = require('./dd');
var net = require('net');

window.UID = 1;
var storage = {};

var get = function(uid) {
	return (storage[uid] || (storage[uid] = {}));
};

var $uid = this.$uid = (window.ActiveXObject) ? function(item){
	if (item === undefined || item === null) return null;
	return (item.uid || (item.uid = [window.UID++]))[0];
} : function(item){
	if (item === undefined || item === null) return null;
	return item.uid || (item.uid = window.UID++);
};

$uid(window);
$uid(document);

if (!window.__domloadHooks) {
	window.__domLoaded = false;
	window.__domloadHooks = [];

	if (document.addEventListener) {
		document.addEventListener('DOMContentLoaded', function() {
			document.removeEventListener('DOMContentLoaded', arguments.callee, false);
			window.__domLoaded = true;
		}, false);
	}

	var timer = null;
	if (ua.ua.webkit && ua.ua.webkit < 525) {
		timer = setInterval(function() {
			if (/loaded|complete/.test(document.readyState)) {
				clearInterval(timer);
				window.__domLoaded = true;
				runHooks();
			}
		}, 10); 
	} else if (ua.ua.ie) {
		timer = setInterval(function() {
			try {
				document.body.doScroll('left');
				clearInterval(timer);
				window.__domLoaded = true;
				runHooks();
			} catch (e) {}
		}, 20); 
	}
}

function runHooks() {
	var callbacks = window.__domloadHooks;
	var fn;
	while (callbacks[0]) {
		try {
			fn = callbacks.shift();
			fn();
		} catch (e) {
			// TODO 去掉XN依赖
			if (XN && XN.DEBUG_MODE) throw e;
		}
	}
}

/**
 * 在dom加载完毕后执行callback。
 * 不同于 DOMContentLoaded 事件，如果 dom.ready 是在页面已经加载完毕后调用的，同样会执行。
 * 用此方法限制需要执行的函数一定会在页面结构加载完毕后执行。
 * @param callback 需要执行的callback函数
 */
this.ready = function(callback) {
	if (typeof callback != 'function') {
		return;
	}
	if (window.__domLoaded == true) {
		callback();
		return;
	}
	//处理DOMContentLoaded触发完毕再动态加载objectjs的情况
	//此时DOMContentLoaded事件已经触发完毕，为DOMContentLoaded添加的事件不触发，且此时window.__domLoaded依然为false
	//解决方案：
	//	参考jQuery的做法，判断readyState是否为complete。
	//	对于3.6以前的Firefox，不支持readyState的，这里暂时忽略
	//	http://webreflection.blogspot.com/2009/11/195-chars-to-help-lazy-loading.html
	//	https://bugzilla.mozilla.org/show_bug.cgi?id=347174
	if (document.readyState == 'complete') {
		window.__domLoaded = true;
		runHooks();
		callback();
		return;
	} 
	if ((ua.ua.webkit && ua.ua.webkit < 525) || !document.addEventListener) {
		window.__domloadHooks.push(callback);
	} else if (document.addEventListener) {
		document.addEventListener('DOMContentLoaded', callback, false);
	}	
};

// 在IE下如果重新设置了父元素的innerHTML导致内部节点发生变化
// 则再次获取内部节点时，所有的原始类型数据（例如String/Boolean/Number）都会保留，所有的引用类型数据（例如Function/Object）都会丢失
// 如果将是否包装过的标识设置为true，在IE下将会出现元素包装过但是没有包装类的引用类型成员的情况
// 因此将包装的标识用空对象代替
// 具体示例请参见单元测试：test/unit/modules/dom/dom-usage.js: dom.wrap error in IE when parent.innerHTML changed
var WRAPPED = {};

/**
 * 包装一个元素，使其拥有相应的Element包装成员
 * 比如 div 会使用 Element 进行包装
 * form 会使用 FormElement 进行包装
 * input / select 等会使用 FormItemElement 进行包装
 * 包装后的节点成员请参照相应的包装类成员
 * @param node 一个原生节点
 */
var wrap = this.wrap = function(node) {
	if (!node) return null;

	if (Array.isArray(node)) {
		return new exports.Elements(node);
	} else {
		// 已经wrap过了
		if (node._wrapped) return node;
		if (ua.ua.ie && node.fireEvent) {
			node._oldFireEventInIE = node.fireEvent;
		}

		var wrapper;
		if (node === window) {
			wrapper = exports.Window;
		} else if (node === window.document) {
			wrapper = exports.Document;
		} else if (node.nodeType === 1) {
			wrapper = getWrapper(node.tagName);
		} else {
			return node;
		}

		// 尽早的设置_wrapped，因为在wrapper的initialize中可能出现递归调用（FormElement/FormItemElement）
		// 为了解决IE的bug，必须设置成引用类型的数据，而不能是原始类型的数据
		node._wrapped = WRAPPED;

		$uid(node);

		// 为了解决子类property覆盖父类instancemethod/classmethod等的问题，需要将property同名的prototype上的属性改为undefined
		// Class.inject对node赋值时，会将undefined的值也进行赋值，而innerHTML、value等值，不能设置为undefined
		Class.inject(wrapper, node, function(prop, dest, src) {
			// dest原有的属性中，function全部覆盖，属性不覆盖已有的
			if (typeof src[prop] != 'function') {
				if (!(prop in dest)) {
					return true;
				} else {
					return false;
				}
			} else {
				return true;
			}
		});

		return node;
	}
};

/**
 * 通过selector获取context作用域下的节点集合
 * dom.Elements包装后的节点数组拥有相应最小Element的统一调用方法
 * 比如 forms = dom.getElements('form'); 'send' in forms // true
 * @param selector 一个css selector
 * @param context 一个节点
 * @returns {dom.Elements}
 */
this.getElements = function(selector, context) {
	if (!selector || typeof selector != 'string') {
		return null;
	}
	if (!context) context = document;

	// 解析成Slick Selector对象
	var parsed = Slick.parse(selector);

	// Slick在面对自定义标签时各种不靠谱，换用sizzle
	var eles = Sizzle(selector, context);

	// 这里通过分析selector的最后一个部分的tagName，来确定这批eles的wrapper
	// 例如selector是 div form.xxx 则wrapper是 FormElement
	// 例如selector是 div .xxx 则wrapper是 Element
	// 例如selector是 div select.xxx, div.input.xxx 则wrapper是 FormItemElement

	var wrapper, part;
	// 绝大部分情况都是length=0，只有1个selector，保证其性能
	if (parsed.expressions.length == 1) {
		part = parsed.expressions[0];
		wrapper = getWrapper(part[part.length - 1].tag);

	// 由多个selector组成，比如 div select.xxx, div.input.xxx，要保证这种能取到 FormItemElement
	} else {
		// 通过生成每个selector wrapper的继承链，不断的生成当前selector和上一个selector的继承链的相同部分
		// 最后的chain的最后一个元素，既是公用wrapper
		for (var i = 0, chain, previousChain; i < parsed.expressions.length; i++) {
			part = parsed.expressions[i];
			wrapper = getWrapper(part[part.length - 1].tag);

			// 当前selector最后元素的wrapper chain
			// slice(0, -1) 过滤掉Element继承的 Attribute 类
			chain = Class.getChain(wrapper).slice(0, -1).reverse();
			if (previousChain) {
				chain = getCommon(chain, previousChain);
			}
			// 如果相同部分length=1，则代表找到Element类了，可以停止继续搜索
			if (chain.length == 1) break;
			previousChain = chain;
		}
		wrapper = chain[chain.length - 1];
	}

	return new exports.Elements(eles, wrapper);
};

/**
 * 通过selector获取context作用域下的第一个节点
 * @param selector 一个css selector
 * @param context 一个节点
 * @returns 一个包装后的结点
 */
this.getElement = function(selector, context) {
	if (!selector || typeof selector != 'string') {
		return null;
	}
	if (!context) context = document;

	var ele = Sizzle(selector, context)[0];
	ele = wrap(ele);
	return ele;
};

/**
 * document.getElementById 的简单调用
 * @param id id
 */
this.id = function(id) {
	return exports.wrap(document.getElementById(id));
};

/**
 * eval inner js
 * 执行某个元素中的script标签
 * @param ele script元素
 */
var eval_inner_JS = this.eval_inner_JS = function(ele) {
	if (!ele) {
		return;
	}
	if (typeof ele == 'string') {
		var node = document.createElement('div');
		// <div>&nbsp;</div> is for IE
		node.innerHTML = '<div>&nbsp;</div> ' + ele;
		ele = node;
	}
	var js = [];
	if (ele.nodeType == 11) { // Fragment
		for (var i = 0, l=ele.childNodes.length, current; i < l; i++) {
			current = ele.childNodes[i];
			if (current.tagName && current.tagName.toUpperCase() == 'SCRIPT') {
				js.push(current);
			} else if (current.nodeType === 1) {
				var subScripts = current.getElementsByTagName('script');
				for(var j = 0, subLength = subScripts.length; j < subLength; j++) {
					js.push(subScripts[j]);
				}
			}
		}
	} else if (ele.nodeType == 1) { // Node
		if (ele.tagName && ele.tagName.toUpperCase() == 'SCRIPT') {
			js.push(ele);
		} else {
			js = ele.getElementsByTagName('script');
		}
	}

	// IE下此句不生效
	// js = [].slice.call(js, 0);

	var arr = [];
	for (i = 0; i < js.length; i++) {
		arr.push(js[i]);
	}

	arr.forEach(function(s, i) {
		if (s.src) {
			// TODO
			return;
		} else {
			var inner_js = '__inner_js_out_put = [];\n';
			inner_js += s.innerHTML.replace( /document\.write/g, '__inner_js_out_put.push' );
			eval(inner_js);
			if (__inner_js_out_put.length !== 0) {
				var tmp = document.createDocumentFragment();
				var div = document.createElement('div');
				div.innerHTML = __inner_js_out_put.join('');
				while(div.firstChild) {
					tmp.appendChild(div.firstChild);
				}
				s.parentNode.insertBefore(tmp, s);
			}
		}
	});
};
	
var _supportUnknownTags = (function() {
	// 检测浏览器是否支持通过innerHTML设置未知标签，典型的就是IE不支持
	var t = document.createElement('div');
	t.innerHTML = '<TEST_TAG></TEST_TAG>';
	// IE 下无法获取到自定义的Element，其他浏览器会得到HTMLUnknownElement
	return !(t.firstChild === null);
})();
// 检测在修改了表单元素的name值后是否会同步form.elements的同名成员
var _supportNamedItemSync = (function() {
	if (ua.ua.ie < 8) return false;
	return true;
})();
var _supportPlaceholder = 'placeholder' in document.createElement('input');
var _supportNaturalWH = 'naturalWidth' in document.createElement('img');
var _supportHTML5Forms = 'checkValidity' in document.createElement('input');
var _supportHidden = 'hidden' in document.createElement('div');
var _supportMultipleSubmit = 'formAction' in document.createElement('input');
// 检测一下是否支持利用selectionStart获取所选区域的光标位置
var _supportSelectionStart = 'selectionStart' in document.createElement('input');

var nativeproperty = function() {
	var prop = property(function(self) {
		return self[prop.__name__];
	}, function(self, value) {
		self._set(prop.__name__, value);
	});
	return prop;
};

var attributeproperty = function(defaultValue, attr) {
	var prop = property(function(self) {
		if (!attr) attr = prop.__name__.toLowerCase();
		var value = self.getAttribute(attr);
		return value != null && value !== 'undefined' ? value : defaultValue;
	}, function(self, value) {
		if (!attr) attr = prop.__name__.toLowerCase();
		// Webkit 534.12中，value为null时，属性会被设置成字符串 null
		if (!value) value = '';
		self.setAttribute(attr, value);
	});
	return prop;
};

/**
 * 通过一个字符串创建一个Fragment
 * @param str html字符串
 */
this.getDom = function(str) {
	var tmp = document.createElement('div');
	var result = document.createDocumentFragment();

	if (!_supportUnknownTags) {
		tmp.style.display = 'none';
		document.body.appendChild(tmp);
	}

	tmp.innerHTML = str;
	while (tmp.firstChild) {
		result.appendChild(wrap(tmp.firstChild));
	}

	if (!_supportUnknownTags) tmp.parentNode.removeChild(tmp);

	return result;
};

/**
 * html5 classList api
 */
this.ElementClassList = new Class(Array, function() {

	this.initialize = function(self, ele) {
		self.length = 0; // for Array

		self._ele = ele;
		self._loadClasses();
	};

	this._loadClasses = function(self) {
    	self._classes  = self._ele.className.replace(/^\s+|\s+$/g, '').split(/\s+/);
	};

	/**
	 * 切换className
	 * @param token class
	 */
	this.toggle = function(self, token) {
		if (!token) {
			throw new Error('token不能为空');
			return;
		}
		if (typeof token != 'string') return;
		if (self.contains(token)) self.remove(token);
		else self.add(token);
	};

	/**
	 * 增加一个class
	 * @param token class
	 */
	this.add = function(self, token) {
		if (!token) {
			throw new Error('token不能为空');
			return;
		}
		if (typeof token != 'string') return;
		if (!self.contains(token)) {
			self._ele.className = (self._ele.className + ' ' + token).trim(); // 根据规范，不允许重复添加
			self._loadClasses();
		}
	};

	/**
	 * 删除class
	 * @param token class
	 */
	this.remove = function(self, token) {
		if (!token) {
			throw new Error('token不能为空');
			return;
		}
		if (typeof token != 'string') return;
		//为了避免出现classAdded中remove class的情况，增加处理
		if (!self.contains(token)) return;
		self._ele.className = self._ele.className.replace(new RegExp(token.trim(), 'i'), '').trim();
		self._loadClasses();
	};

	/**
	 * 检测是否包含该class
	 * @param token class
	 */
	this.contains = function(self, token) {
		if (!token) {
			throw new Error('token不能为空');
			return false;
		}
		if (typeof token != 'string') return false;
		if (self._classes.indexOf(token) != -1) return true;
		else return false;
	};

	/**
	 * 返回此下标的class
	 * @param {int} i 下标
	 */
	this.item = function(self, i) {
		return self._classes[i] || null;
	};

	this.toString = function (self) {
		return self._ele.className;
	};

});

/**
 * 每一个待封装DOM元素都包含的事件
 */
var basicNativeEventNames = ['click', 'dblclick', 'mouseup', 'mousedown', 'contextmenu',
		'mouseover', 'mouseout', 'mousemove', 'selectstart', 'selectend', 'keydown', 'keypress', 'keyup']
/**
 * 普通元素的包装
 */
this.Element = new Class(function() {

	Class.mixin(this, events.Events);
	Class.mixin(this, dd.DragDrop);

	this.nativeEventNames = basicNativeEventNames;

	this.initialize = function(self, tagName) {
		// 直接new Element，用来生成一个新元素
		if (tagName) {
			self = document.createElement(tagName);
			wrap(self);

		// 包装现有元素
		} else {
		}
		// self可能是已经包装过的对象，不要将其身上的__eventListeners清除掉
		if (!self.__eventListeners) self.__eventListeners = {};
		if (!self.__nativeEvents) self.__nativeEvents = {};
		if (self.classList === undefined && self !== document && self !== window) {
			self.classList = new exports.ElementClassList(self);
		}
		self.delegates = {};
	};

	/**
	 * 控制显示隐藏
	 */
	this.hidden = _supportHidden? nativeproperty() : property(function(self) {
		return self.style.display == 'none';
	}, function(self, value) {
		if (value == true) {
			if (self.style.display !== 'none') self.__oldDisplay = self.style.display;
			self.style.display = 'none';
		} else {
			self.style.display = self.__oldDisplay || '';
		}
	});

	/**
	 * 从dom读取数据
	 * @param property 数据key
	 * @param defaultValue 若没有，则返回此默认值
	 */
	this.retrieve = function(self, property, defaultValue){
		var storage = get(self.uid);
		if (!(property in storage) && defaultValue !== undefined) storage[property] = defaultValue;
		return storage[property];
	};

	/**
	 * 存储数据至dom
	 * @param property 数据key
	 * @param value 数据值
	 */
	this.store = function(self, property, value){
		var storage = get(self.uid);
		storage[property] = value;
		return self;
	};

	/**
	 * 事件代理
	 * @param selector 需要被代理的子元素selector
	 * @param type 事件名称
	 * @param callback 事件回调
	 * @param option 事件的冒泡/捕获阶段，是否lock的组合标识
	 */
	this.delegate = function(self, selector, type, fn, option) {

		function wrapper(e) {
			var ele = e.srcElement || e.target;
			do {
				if (ele && exports.Element.get('matchesSelector')(ele, selector)) fn.call(wrap(ele), e);
			} while((ele = ele.parentNode));
		}

		var key = selector + '_' + type;
		if (!self.delegates) {
			self.delegates = {};
		}
		if (!(key in self.delegates)) {
			self.delegates[key] = [];
		}
		self.delegates[key].push({
			wrapper: wrapper,
			fn: fn
		});

		self.addEvent(type, wrapper, option);
	};

	/**
	 * 事件代理
	 * @param selector 需要被代理的子元素selector
	 * @param type 事件名称
	 * @param callback 事件回调
	 * @param option 事件的冒泡/捕获阶段，是否lock的组合标识
	 */
	this.undelegate = function(self, selector, type, fn, option) {

		var key = selector + '_' + type;
		if (!self.delegates) {
			self.delegates = {};
		}
		// 没有这个代理
		if (!(key in self.delegates)) return;

		self.delegates[key].forEach(function(item) {
			if (item.fn === fn) {
				self.removeEvent(type, item.wrapper, option);
				return;
			}
		});
	};

	/**
	 * html5 matchesSelector api
	 * 检测元素是否匹配selector
	 * @param selector css选择符
	 */
	this.matchesSelector = function(self, selector) {
		return Sizzle.matches(selector, [self]).length > 0;
	};

	/**
	 * 获取元素上通过 data- 前缀定义的属性值
	 * @param data name
	 * @return data value
	 */
	this.getData = function(self, name) {
		return self.getAttribute('data-' + name);
	};

	/**
	 * 设置元素的innerHTML
	 * @param str html代码
	 */
	this.setHTML = function(self, str) {
		self.set('innerHTML', str);
	};

	/**
	 * @borrows dom.Element.setHTML
	 */
	this.setContent = function(self, str) {
		self.setHTML(str);
	};

	/**
	 * 根据选择器返回第一个符合selector的元素
	 * @param selector css选择符
	 */
	this.getElement = function(self, selector) {
		return exports.getElement(selector, self);
	};

	/**
	 * 根据选择器返回数组
	 * @param selector css选择符
	 */
	this.getElements = function(self, selector) {
		return exports.getElements(selector, self);
	};

	var inserters = {
		before: function(context, element){
			var parent = element.parentNode;
			if (parent) parent.insertBefore(context, element);
		},
		after: function(context, element){
			var parent = element.parentNode;
			if (parent) parent.insertBefore(context, element.nextSibling);
		},
		bottom: function(context, element){
			element.appendChild(context);
		},
		top: function(context, element){
			element.insertBefore(context, element.firstChild);
		}
	};
	inserters.inside = inserters.bottom;

	/**
	 * @param el 被添加的元素
	 * @param where {'bottom'|'top'|'after'|'before'} 添加的位置
	 */
	this.grab = function(self, el, where) {
		inserters[where || 'bottom'](el, self);
		return self;
	};

	/**
	 * @param el 被添加的元素
	 * @param where {'bottom'|'top'|'after'|'before'} 添加的位置
	 */
	this.inject = function(self, el, where) {
		inserters[where || 'bottom'](self, el);
		return self;
	};

	/**
	 * 获取第一个符合selector的前兄弟节点
	 *
	 * @param selector css选择符
	 */
	this.getPrevious = function(self, selector) {
		var matchesSelector = selector ? exports.Element.get('matchesSelector') : null;
		var element = self;
		while(element = element.previousSibling) {
			// 注释节点
			if (element.nodeType == 8) {
				continue;
			}
			if (!matchesSelector || matchesSelector(element, selector)) {
				return wrap(element);
			}
		}
		return null;
	};

	/**
	 * 获取符合selector的所有前兄弟节点
	 *
	 * @param selector css选择符
	 */
	this.getAllPrevious = function(self, selector) {
		var matchesSelector = selector ? exports.Element.get('matchesSelector') : null;
		var result = [];
		var element = self;
		while(element = element.previousSibling) {
			// 注释节点
			if (element.nodeType == 8) {
				continue;
			}
			if (!matchesSelector || matchesSelector(element, selector)) {
				result.push(wrap(element));
			}
		}
		return result;
	};

	/**
	 * 获取第一个符合selector的后兄弟节点
	 *
	 * @param selector css选择符
	 */
	this.getNext = function(self, selector) {
		var matchesSelector = selector ? exports.Element.get('matchesSelector') : null;
		var element = self;
		while(element = element.nextSibling) {
			// 注释节点
			if (element.nodeType == 8) {
				continue;
			}
			if (!matchesSelector || matchesSelector(element, selector)) {
				return wrap(element);
			}
		}
		return null;
	};

	/**
	 * 获取所有符合selector的后兄弟节点列表
	 *
	 * @param selector css选择符
	 */
	this.getAllNext = function(self, selector) {
		var matchesSelector = selector ? exports.Element.get('matchesSelector') : null;
		var result = [];
		var element = self;
		while(element = element.nextSibling) {
			// 注释节点
			if (element.nodeType == 8) {
				continue;
			}
			if (!matchesSelector || matchesSelector(element, selector)) {
				result.push(wrap(element));
			}
		}
		return result;
	};

	/**
	 * 获取第一个符合selector的子节点
	 *
	 * @param selector css选择符
	 */
	this.getFirst = function(self, selector) {
		var matchesSelector = selector ? exports.Element.get('matchesSelector') : null;
		var childrens = self.childNodes, l = childrens.length;
		for (var i = 0, element; i < l; i++) {
			element = childrens[i];
			if (element.nodeType == 8) {
				continue;
			}
			if (!matchesSelector || matchesSelector(element, selector)) {
				return wrap(element);
			}
		}
		return null;
	};

	/**
	 * 获取最后一个符合selector的子节点
	 *
	 * @param selector css选择符
	 */
	this.getLast = function(self, selector) {
		var matchesSelector = selector ? exports.Element.get('matchesSelector') : null;
		var childrens = self.childNodes, l = childrens.length;
		for (var i = l - 1, element; i >= 0 ; i--) {
			element = childrens[i];
			if (element.nodeType == 8) {
				continue;
			}
			if (!matchesSelector || matchesSelector(element, selector)) {
				return wrap(element);
			}
		}
		return null;
	};

	/**
	 * 查找符合selector的父元素
	 *
	 * @param selector css选择符
	 */
	this.getParent = function(self, selector) {
		if (!selector) return wrap(self.parentNode);

		var matchesSelector = exports.Element.get('matchesSelector');
		var element = self;
		do {
			if (matchesSelector(element, selector)) return wrap(element);
		} while ((element = element.parentNode));
		return null;
	};
	
	/**
	 * 查找符合selector的所有父元素
	 *
	 * @param selector css选择符
	 */
	this.getParents = function(self, selector) {
		var matchesSelector = selector ? exports.Element.get('matchesSelector') : null;
		var result = [];
		var element = self;
		while(element = element.parentNode) {
			// 注释节点
			if (element.nodeType == 8) continue;
			if (!matchesSelector || matchesSelector(element, selector)) {
				result.push(wrap(element));
			}
		}
		return result;
	};

	/**
	 * 获取所有符合selector的兄弟节点列表
	 *
	 * @param selector css选择符
	 */
	this.getSiblings = function(self, selector) {
		return self.getAllPrevious(selector).concat(self.getAllNext(selector));
	};

	/**
	 * 获取所有符合selector的孩子节点列表
	 *
	 * @param selector css选择符
	 */
	this.getChildren = function(self, selector) {
		var matchesSelector = selector ? exports.Element.get('matchesSelector') : null;
		var childrens = self.childNodes, l = childrens.length, result = [];
		for (var i = 0, element; i < l ; i++) {
			element = childrens[i];
			if (element.nodeType == 8) {
				continue;
			}
			if (!matchesSelector || matchesSelector(element, selector)) {
				result.push(wrap(element));
			}
		}
		return result;
	};

	/**
	 * 添加className
	 * @param name
	 */
	this.addClass = function(self, name) {
		if (!name) {
			return;
		}
		self.classList.add(name);
	};

	/**
	 * 移除className
	 * @param name
	 */
	this.removeClass = function(self, name) {
		if (!name) {
			return;
		}
		self.classList.remove(name);
	};

	/**
	 * 切换className
	 * @param name
	 */
	this.toggleClass = function(self, name) {
		if (!name) {
			return;
		}
		self.classList.toggle(name);
	};

	/**
	 * 检查是否拥有className
	 * @param name
	 */
	this.hasClass = function(self, name) {
		if (!name) {
			return false;
		}
		return self.classList.contains(name);
	};

	// opacity属性的辅助内容，参考Mootools
	var html = document.documentElement;
	var floatName = (html.style.cssFloat == null) ? 'styleFloat' : 'cssFloat',
		hasOpacity = (html.style.opacity != null),
		hasFilter = (html.style.filter != null),
		reAlpha = /alpha\(opacity=([\d.]+)\)/i;

	/**
	 * 透明度属性设置
	 */
	this.opacity = property(function(self) {
		if (hasOpacity) {
			return self.style.opacity;
		} else if (hasFilter) {
			// var filter = self.style.filter || self.getComputedStyle('filter');
			var filter = self.style.filter || self.currentStyle.filter;
			if (filter) opacity = filter.match(reAlpha);
			return (opacity == null || filter == null) ? 1 : (opacity[1] / 100);
		} else {
			return self.retrieve('opacity');
		}
	}, function(self, opacity) {
		if (hasOpacity) {
			self.style.opacity = opacity;
		} else if (hasFilter) {
			if (!self.currentStyle || !self.currentStyle.hasLayout) self.style.zoom = 1;
			opacity = parseInt(opacity * 100);
			if (opacity > 100) {
				opacity = 100;
			} else if (opacity < 0) {
				opacity = 0;
			}
			
			var opacityStr = opacity == 100 ? '' : 'alpha(opacity=' + opacity + ')';
			// getComputedStyle在IE中并不存在，Mootools中使用了
			// var filter = self.style.filter || self.getComputedStyle('filter') || '';
			var filter = self.style.filter || self.currentStyle.filter || '';
			self.style.filter = reAlpha.test(filter) ? filter.replace(reAlpha, opacityStr) : filter + opacityStr;
		} else {
			self.store('opacity', opacity);
			self.style.visibility = opacity > 0 ? 'visible' : 'hidden';
		}
	});

	/**
	 * 设置inline style
	 * @param property
	 * @param value
	 */
	this.setStyle = function(self, property, value) {
		switch (property){
			case 'opacity':
				return self.set('opacity', parseFloat(value));
			case 'float':
				property = floatName;
				break;
			default:
				break;
		}
		property = string.camelCase(property);
		self.style[property] = value;

		return null;
	};

	/**
	 * 移除自己
	 */
	this.dispose = function(self) {
		return (self.parentNode) ? self.parentNode.removeChild(self) : self;
	};
	
	/**
	 * 隐藏一个元素
	 */
	this.hide = function(self) {
		if (self.style.display !== 'none') self.oldDisplay = self.style.display;
		self.style.display = 'none';
	};

	/**
	 * 显示一个元素
	 */
	this.show = function(self) {
		self.style.display = self.oldDisplay || '';
	};

	/**
	 * 切换显示
	 */
	this.toggle = function(self) {
		if (self.style.display == 'none') self.show();
		else self.hide();
	};

	/**
	 * 通过字符串设置此元素的内容
	 * 为兼容HTML5标签，IE下无法直接使用innerHTML
	 */
	this.innerHTML = property(null, function(self, html) {
		if (_supportUnknownTags) {
			self.innerHTML = html;
		} else {
			var nodes = exports.getDom(html);
			self.innerHTML = '';
			while (nodes.firstChild) self.appendChild(nodes.firstChild);
		}
	});

	/**
	 * 保证大写的tagName
	 */
	this.tagName = property(function(self) {
		return self.tagName.toUpperCase();
	});

	/**
	 * 通过一个字符串创建一个包装后的dom节点
	 * 以下元素无法被处理哦：
	 * html/head/body/meta/link/script/style
	 */
	this.fromString = staticmethod(function(str) {
		var tmp = document.createElement('div');
		if (!_supportUnknownTags) {
			tmp.style.display = 'none';
			document.body.appendChild(tmp);
		}
		tmp.innerHTML = str.trim();
		var result = wrap(tmp.firstChild);
		if (!_supportUnknownTags) tmp.parentNode.removeChild(tmp);
		return result;
	});

});

/**
 * img元素的包装
 */
this.ImageElement = new Class(exports.Element, function() {

	this.nativeEventNames = basicNativeEventNames.concat(['error', 'abort']);

	// 获取naturalWidth和naturalHeight的方法
	// http://jacklmoore.com/notes/naturalwidth-and-naturalheight-in-ie/
	function _getNaturalSize(img) {
		// 参考jQuery
		var anotherImg = new Image();
		anotherImg.src = img.src;
		return {
			width : anotherImg.width,
			height : anotherImg.height
		};

		/**
		 * 在IE下得不到原来的尺寸
		var style = img.runtimeStyle;
		var old = {
			w: style.width,
			h: style.height
		}; //保存原来的尺寸
		style.width = style.height = "auto"; //重写
		var w = img.width; //取得现在的尺寸
		var h = img.height;
		style.width  = old.w; //还原
		style.height = old.h;
		return {
			width: w,
			height: h
		};
		*/
	};

	this.naturalWidth = property(function(self) {
		if (_supportNaturalWH) {
			return self.naturalWidth;
		} else {
			return _getNaturalSize(self).width;
		}
	});

	this.naturalHeight = property(function(self) {
		if (_supportNaturalWH) {
			return self.naturalHeight;
		} else {
			return _getNaturalSize(self).height;
		}
	});

});

/**
 * form元素的包装
 */
this.FormElement = new Class(exports.Element, function() {

	this.nativeEventNames = basicNativeEventNames.concat(['reset', 'submit']);

	this.initialize = function(self) {
		this.parent(self);

		if (self.elements) {
			for (var i = 0; i < self.elements.length; i++) {
				wrap(self.elements[i]);
			}
		}

		// 用自己的namedItem替换系统提供的，系统提供的在修改了name属性后无法同步
		if (!_supportNamedItemSync) {
			self.elements.namedItem = function(name) {
				return Sizzle('*[name=' + name + ']', self)[0];
			}
		}

		// 对于不支持多表单提交的浏览器在所有表单提交时都判断一下是否来源于特殊的提交按钮
		if (!_supportMultipleSubmit) {
			self.addNativeEvent('submit', function(event) {
				// 不是由一个特殊按钮触发的，直接返回
				if (!self.__submitButton) return;

				var button = self.__submitButton;
				self.__submitButton = null;

				// 在提交之前，用按钮的属性替换表单的属性
				var oldAction = self.action;
				var oldMethod = self.method;
				var oldEnctype = self.encoding || self.enctype;
				var oldNoValidate = self.noValidate;
				var oldTarget = self.target;
				var formAction = button.getAttribute('formaction');
				var formMethod = button.getAttribute('formmethod');
				var formEnctype = button.getAttribute('formenctype');
				var formNoValidate = button.getAttribute('formnovalidate');
				var formTarget = button.getAttribute('formtarget');
				if (formAction) self.action = formAction;
				if (formMethod) self.method = formMethod;
				if (formEnctype) self.enctype = self.encoding = formEnctype;
				if (formNoValidate) self.formNoValidate = formNoValidate;
				if (formTarget) self.target = formTarget;

				var preventDefaulted = event.getPreventDefault? event.getPreventDefault() : event.defaultPrevented;
				if (!preventDefaulted) {
					event.preventDefault();
					self.submit();
				}

				// 傲游3的webkit内核在执行submit时是异步的，导致submit真正执行前，下面这段代码已经执行，action和target都被恢复回去了。
				// 做一个兼容，maxthon3中用setTimeout进行恢复。
				if (ua.ua.webkit <= 534.12) {
					setTimeout(function() {
						// 提交之后再恢复回来
						self.action = oldAction;
						self.method = oldMethod;
						self.enctype = self.encoding = oldEnctype;
						self.formNoValidate = oldNoValidate;
						self.target = oldTarget;
					}, 0);
				} else {
					// 提交之后再恢复回来
					self.action = oldAction;
					self.method = oldMethod;
					self.enctype = self.encoding = oldEnctype;
					self.formNoValidate = oldNoValidate;
					self.target = oldTarget;
				}

			});
		}
	};

	/**
	 * 根据现有表单，创建一个Request对象
	 */
	this.createRequest = function(self, params) {
		if (!params) params = {};
		if (!params.method) params.method = self.method;
		if (!params.url) params.url = self.action;
		if (!params.data) params.data = self.toQueryString();
		if (!params.onsuccess) params.onsuccess = function(event) {
			self.fireEvent('requestSuccess', {request: event.request});
		};
		if (!params.onerror) params.onerror = function(event) {
			self.fireEvent('requestError', {request: event.request});
		};
		if (net) {
			xhr = new net.Request(params);
		} else {
			throw new object.ModuleRequiredError('net', module);
		}
		return xhr;
	};

	/**
	 * 用ajax发送一个表单
	 */
	this.send = function(self, data) {
		var request = self.createRequest();
		request.send(data);
		return request;
	};

	/**
	 * 将一个表单转换成queryString
	 */
	this.toQueryString = function(self) {
		var queryString = [];

		function addItem(name, value) {
			if (typeof value != 'undefined') queryString.push(encodeURIComponent(name) + '=' + encodeURIComponent(value));
		}

		self.getElements('input, select, textarea, output').forEach(function(el) {
			var type = el.type;
			if (!el.name || el.disabled || type == 'submit' || type == 'reset' || type == 'file' || type == 'image') return;

			if (el.tagName.toLowerCase() == 'select') {
				el.getSelected().map(function(opt) {
					// IE
					var value = wrap(opt).get('value');
					addItem(el.name, value);
				});
			} else if (type == 'radio' || type == 'checkbox') {
				if (el.checked) {
					addItem(el.name, el.get('value'));
				}
			} else {
				addItem(el.name, el.get('value'));
			}

		});
		return queryString.join('&');
	};

	this.checkValidity = function(self) {
		return self.getElements('input, select, textarea, output').every(function(el) {
			return el.checkValidity();
		});
	};

});

/**
 * textarea / input / textarea / select / option 元素的包装
 */
this.FormItemElement = new Class(exports.Element, function() {

	this.nativeEventNames = basicNativeEventNames.concat(['focus', 'blur', 'change', 'select', 'paste']);

	this.required = _supportHTML5Forms ? nativeproperty() : attributeproperty(false);
	this.pattern  = _supportHTML5Forms ? nativeproperty() : attributeproperty('');
	this.maxlength = nativeproperty();
	this.type = _supportHTML5Forms ? nativeproperty() : attributeproperty('text');
	this.min = _supportHTML5Forms ? nativeproperty() : attributeproperty('');
	this.max = _supportHTML5Forms ? nativeproperty() : attributeproperty('');

	/**
	 * selectionStart
	 * IE下获取selectionStart时，必须先在业务代码中focus该元素，否则返回-1
	 *
	 * @return 获取过程中发生任何问题，返回-1，否则返回正常的selectionStart
	 */
	this.selectionStart = property(function(self) {
		try {
			// 避免在火狐下，获取不可见元素的selectionStart出错
			if (typeof self.selectionStart == 'number') {
				return self.selectionStart;
			}
		} catch (e) {
			return -1;
		}

		// IE
		if (document.selection) {
			// 参考JQuery插件：fieldSelection
			var range = document.selection.createRange();
			// IE下要求元素在获取selectionStart时必须先focus，如果focus的元素不是自己，则返回-1
			if (range == null || range.parentElement() != self) {
				if (self.__selectionPos) {
					return self.__selectionPos.start;
				} else {
					return -1;
				}
			}
			return calculateSelectionPos(self).start;
		} else {
			return -1;
		}
	});
        
	/**
	 * selectionEnd
	 * IE下获取selectionEnd时，必须先在业务代码中focus该元素，否则返回-1
	 *
	 * @return 获取过程中发生任何问题，返回-1，否则返回正常的selectionEnd
	 */
	this.selectionEnd = property(function(self) {
		try {
			// 避免在火狐下，获取不可见元素的selectionEnd出错
			if (typeof self.selectionEnd == 'number') {
				return self.selectionEnd;
			}
		} catch (e) {
			return -1;
		}

		// IE
		if (document.selection) {
			// 参考JQuery插件：fieldSelection
			var range = document.selection.createRange();
			// IE下要求元素在获取selectionEnd时必须先focus，如果focus的元素不是自己，则返回0
			if (range == null || range.parentElement() != self) {
				if (self.__selectionPos) {
					return self.__selectionPos.end;
				} else {
					return -1;
				}
			}
			return calculateSelectionPos(self).end;
		} else {
			return -1;
		}
	});

	/**
	 * select元素所有已选择元素
	 */
	this.getSelected = function(self) {
		self.selectedIndex; // Safari 3.2.1
		var selected = [];
		for (var i = 0; i < self.options.length; i++) {
			if (self.options[i].selected) selected.push(self.options[i]);
		};
		return selected;
	};

	/**
	 * value，在不支持placeholder的浏览器忽略placeholder的值
	 */
	this.value = property(function(self) {
		// 如果是placeholder，则value为空
		if (self.classList.contains('placeholder')) return '';
		return self.value;
	}, function(self, value) {
		// 设置value的时候取消placeholder模式
		if (self.classList.contains('placeholder')) {
			self.classList.remove('placeholder');
			self.removeAttribute('autocomplete');
			self.value = '';
		}
		self.value = value;
		if (!_supportPlaceholder && !self.value && self.getAttribute('placeholder')) {
			self.classList.add('placeholder');
			self.value = self.getAttribute('placeholder');
			self.setAttribute('autocomplete', 'off');
		};
		self.checkValidity();
	});

	/**
	 * HTML5 validity
	 */
	this.validity = _supportHTML5Forms? property(function(self) {
		return self.validity;
	}) : property(function(self) {
		// required pattern min max step
		// text search url tel email password
		var value = self.get('value');
		
		var validity = {
			// 在firefox3.6.25中，self.getAttribute('required')只能获取到self.setAttribute('required', true)的值
			// self.required = true设置的值无法获取
			valueMissing: (function () {
				// valueMissing: self.getAttribute('required') && (!value ? true : false) 在IE6下有误
				// 例如：undefined && (1== 1)  在IE6下返回undefined
				var required = self.getAttribute('required');
				if (required) {
					return !value ? true : false;
				} else {
					return false;
				}
			})(),
			typeMismatch: (function(type) {
				if (type == 'url') return !(/^\s*(?:(\w+?)\:\/\/([\w-_.]+(?::\d+)?))(.*?)?(?:;(.*?))?(?:\?(.*?))?(?:\#(\w*))?$/i).test(value);
				if (type == 'tel') return !(/[^\r\n]/i).test(value);
				if (type == 'email') return !(/^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/i).test(value);
				return false;
			})(self.getAttribute('type')),
			patternMismatch: (function() {
				var pattern = self.get('pattern');
				if (pattern) {
					return !(new RegExp('^' + pattern + '$')).test(value);
				} else {
					return false;
				}
			})(),
			tooLong: (function() {
				var maxlength = self.get('maxlength');
				var n = Number(maxlength);
				if (n != maxlength) return false;
				return value.length > n;
			})(),
			customError: !!self.__customValidity,
			// 以下三个 firefox 4 beta 也不支持，暂时不支持
			rangeUnderflow: false,
			rangeOverflow: false,
			stepMismatch: false
		};
		validity.valid = ['valueMissing', 'typeMismatch', 'patternMismatch', 'tooLong', 'rangeUnderflow', 'rangeOverflow', 'stepMismatch', 'customError'].every(function(name) {
			return validity[name] === false;
		});
		self.__validationMessage = (function() {
			if (validity.valid) return '';
			// Logic from webkit
			// http://www.google.com/codesearch#N6Qhr5kJSgQ/WebCore/html/ValidityState.cpp&type=cs
			// 文案通过Firefox和Chrome测试而来
			// 虽然有可能同时不满足多种验证，但是message只输出第一个
			if (validity.customError) return self.__customValidity;
			if (validity.valueMissing) return '请填写此字段。';
			if (validity.typeMismatch) return '请输入一个' + self.getAttribute('type') + '。';
			if (validity.patternMismatch) return '请匹配要求的格式。';
			if (validity.tooLong) return '请将该文本减少为 ' + self.get('maxlength') + ' 个字符或更少（您当前使用了' + self.get('value').length + '个字符）。';
			if (validity.rangeUnderflow) return '值必须大于或等于' + self.getAttribute('min') + '。';
			if (validity.rangeOverflow) return '值必须小于或等于' + self.getAttribute('max') + '。';
			if (validity.stepMismatch) return '值无效。';
		})();
		self._set('validationMessage', self.__validationMessage);

		self._set('validity', validity);
		return validity;
	});

	/**
	 * HTML5 validationMessage
	 */
	this.validationMessage = _supportHTML5Forms? property(function(self) {
		return self.validationMessage;
	}) : property(function(self) {
		self.get('validity');
		return self.__validationMessage;
	});

	if (!_supportHTML5Forms) {
		/* TODO */
		// autofocus
		// willvalidate
		// formnovalidate

		/**
		 * HTML5 setCustomValidity
		 */
		this.setCustomValidity = function(self, message) {
			self.__customValidity = message;
			self.get('validity');
		};

		/**
		 * HTML5 checkValidity
		 */
		this.checkValidity = function(self) {
			self.get('validity');
			return self.validity.valid;
		};
	}

	/**
	 * focus，并且将光标定位到指定的位置上
	 */
	this.focusToPosition = function(self, position) {
		if (position === undefined) {
			position = self.get('value').length;
		}

		if (self.setSelectionRange) {
			self.focus();
			self.setSelectionRange(self.get('value').length, position);
		} else if (self.createTextRange) {
			var range = self.createTextRange();
			range.moveStart('character', position);
			range.collapse(true);
			range.select();
			self.focus();
		} else {
			self.focus();
		}
	};

});

/**
 * input / textarea 元素的包装类的基类
 */
this.TextBaseElement = new Class(exports.FormItemElement, function() {

	this.initialize = function(self) {
		this.parent(self);

		if (!_supportPlaceholder) {
			self.bindPlaceholder();
		}
		if (!_supportSelectionStart) {
			// 在每一次即将失去焦点之前，保存一下当前的selectionStart和selectionEnd的值
			self.addEvent('beforedeactivate', function() {
				/** 在失去焦点时保存selectionStart和selectionEnd的值，只在IE下用 */
				self.__selectionPos = calculateSelectionPos(self);
			});
		}
	};

	/**
	 * 占位符
	 */
	this.placeholder = property(function(self) {
		return self.getAttribute('placeholder');
	}, function(self, value) {
		self.setAttribute('placeholder', value);
		if (!_supportPlaceholder) {
			self.bindPlaceholder();
			if (self.get('_placeholding')) self.value = value;
		}
	});

	/**
	 * 是否处于占位符状态
	 */
	this._placeholding = property(function(self) {
		return self.classList.contains('placeholder');
	}, function(self, value) {
		if (value) {
			self.classList.add('placeholder');
			self.setAttribute('autocomplete', 'off');
		} else {
			self.classList.remove('placeholder');
			self.removeAttribute('autocomplete');
		}
	});

	/**
	 * bind一个input或者textarea，使其支持placeholder属性
	 */
	this.bindPlaceholder = function(self) {
		if (self._binded) return;
		self._binded = true;

		// 通过autocomplete=off避免浏览器记住placeholder
		function checkEmpty(event) {
			var placeholder = self.get('placeholder');
			if (!placeholder) return;

			if (self.get('_placeholding')) {
				if (event.type == 'focus' && self.value === placeholder) {
					self.value = '';
				}
				self.set('_placeholding', false);

			// IE不支持autocomplete=off，刷新页面后value还是placeholder（其他浏览器为空，或者之前用户填写的值），只能通过判断是否相等来处理
			} else if (!self.value || ((ua.ua.ie == 6 || ua.ua.ie == 7) && !event && self.value == placeholder)) {
				self.set('_placeholding', true);
				self.value = placeholder;
			}
		}
		self.addNativeEvent('focus', function(event) {
			return checkEmpty(event);
		});
		self.addNativeEvent('blur', function(event) {
			return checkEmpty(event);
		});
		// 在IE6下，由于事件执行顺序的问题，当通过send()发送一个表单时，下面这段脚本实际上是不工作的
		// 也就是说，在send()时，self.value还是placeholder的值，导致把placeholder的值发送出去了
		// 通过在toQueryString中调用get('value')过滤掉placeholder的值
		// 完美的解决方法大概是需要接管IE6下的事件系统，工程量比较大。
		if (self.form) {
			// addNativeEvent，确保此事件在最后执行
			wrap(self.form).addNativeEvent('submit', function() {
				if (self.classList.contains('placeholder')) {
					self.set('_placeholding', false);
					self.value = '';
					// 如果此表单提交没有导致浏览器刷新，则会执行以下setTimeout，将placeholder置回
					setTimeout(function() {
						checkEmpty();
					}, 0);
				}
			});
		}
		checkEmpty();
	};

});

/**
 * input元素的包装类
 * @class
 */
this.InputElement = new Class(exports.TextBaseElement, function() {

	/**
	 * HTML5 formAction
	 */
	this.formAction = _supportMultipleSubmit? nativeproperty() : attributeproperty('');

	/**
	 * HTML5 formEnctype
	 */
	this.formEnctype = _supportMultipleSubmit? nativeproperty() : attributeproperty('application/x-www-form-urlencoded');

	/**
	 * HTML5 formMethod
	 */
	this.formMethod = _supportMultipleSubmit? nativeproperty() : attributeproperty('get');

	/**
	 * HTML5 formNoValidate
	 */
	this.formNoValidate = _supportMultipleSubmit? nativeproperty() : attributeproperty(false);

	/**
	 * HTML5 formTarget
	 */
	this.formTarget = _supportMultipleSubmit? nativeproperty() : attributeproperty('');

	this.initialize = function(self) {
		this.parent(self);

		if (!_supportMultipleSubmit) {
			self.addNativeEvent('click', function(event) {
				if (self.type == 'submit') {
					self.form.__submitButton = self;
				}
			});
		}
	};

	/**
	 * 用ajax发送一个表单
	 * @param data 发送的数据
	 */
	this.send = function(self, data) {
		if (self.type != 'submit') return;
		var request = self.form.createRequest({
			method: self.getAttribute('formmethod') || self.form.method,
			url: self.getAttribute('formaction') || self.form.action,
			onsuccess: function(event) {
				self.fireEvent('requestSuccess', {request: event.request});
			},
			onerror: function(event) {
				self.fireEvent('requestError', {request: event.request});
			}
		});
		request.send(data);
		return request;
	};

});

/**
 * textarea元素的包装类
 */
this.TextAreaElement = new Class(exports.TextBaseElement, function() {
});

/**
 * window元素的包装类
 */
this.Window = new Class(exports.Element, function() {
	this.nativeEventNames = basicNativeEventNames.concat(
		['load', 'unload', 'beforeunload', 'resize', 'move', 'DomContentLoaded', 'readystatechange', 'scroll', 'mousewheel', 'DOMMouseScroll']);
});

/**
 * document元素的包装类
 */
this.Document = new Class(exports.Element, function() {
	this.nativeEventNames = basicNativeEventNames.concat(
		['load', 'unload', 'beforeunload', 'resize', 'move', 'DomContentLoaded', 'readystatechange', 'scroll', 'mousewheel', 'DOMMouseScroll']);
});

/**
 * 一个包装类，实现Element方法的统一调用
 */
this.Elements = new Class(Array, function() {

	/**
	 * @param elements native dom elements
	 * @param wrapper 这批节点的共有类型，默认为Element
	 */
	this.initialize  = function(self, elements, wrapper) {
		if (!wrapper) wrapper = exports.Element;

		for (var i = 0; i < elements.length; i++) {
			self.push(wrap(elements[i]));
		}

		Class.keys(wrapper).forEach(function(name) {
			if (typeof wrapper.get(name) != 'function') return;

			self[name] = function() {
				var element;
				for (var i = 0; i < self.length; i++) {
					element = self[i];
					if (typeof element[name] == 'function') {
						element[name].apply(self[i], [].slice.call(arguments, 0));
					}
				}
			};
		});

		self.set = function(key, value) {
			for (var i = 0; i < self.length; i++) {
				self[i].set(key, value);
			}
		};

		self.get = function(key) {
			var result = [];
			for (var i = 0; i < self.length; i++) {
				result.push(self[i].get(key));
			}
			return result;
		};
	};

});

var _tagMap = {
	'IMG': exports.ImageElement,
	'FORM': exports.FormElement,
	'INPUT': exports.InputElement,
	'TEXTAREA': exports.TextAreaElement,
	'OUTPUT': exports.FormItemElement,
	'SELECT': exports.FormItemElement,
	'OPTION': exports.FormItemElement,
	'BUTTON': exports.FormItemElement
};

// 根据ele的tagName返回他所需要的wrapper class
function getWrapper(tagName) {
	var tag = tagName.toUpperCase();
	var cls = _tagMap[tag];
	if (cls) return cls;
	else return exports.Element;
}

// 比较两个数组，直到同位的成员不同，返回之前的部分
// [1,2,3,4], [1,2,5,6] 返回 [1,2]
function getCommon(arr1, arr2) {
	var i;
	for (i = 0, l = arr1.length; i < l; i++) {
		if (!arr2[i] || arr2[i] !== arr1[i]) {
			break;
		}
	}
	return arr1.slice(0, i);
}

/**
 * IE下，在焦点即将离开此元素时，计算一下selectionStart和selectionEnd备用
 *
 * @param {HTMLElement} field 焦点即将离开的元素，input/textarea
 * @return {Object} 位置信息对象，包含{start:起始位置, end:终止位置}
 */
function calculateSelectionPos(field) {
	// 参考JQuery插件：fieldSelection
	var range = document.selection.createRange();
	if (range == null || range.parentElement() != field) {
		return {start:-1, end:-1};
	}
	var elementRange = field.createTextRange();
	var duplicated = elementRange.duplicate();
	elementRange.moveToBookmark(range.getBookmark());
	//将选中区域的起始点作为整个元素区域的终点
	duplicated.setEndPoint('EndToStart', elementRange);
	return {
		start: duplicated.text.length, 
		end  : duplicated.text.length + range.text.length
	};
}
});
object.add('dom/dd.js', 'ua, events, sys', function(exports, ua, events, sys) {

	//如何判断浏览器支持HTML5的拖拽：
	//Detecting "draggable' in document.createElement('span') seems like a good idea, but in practice it doesn't work.
	//iOS claims that draggable is in the element but doesn't allow drag and drop.(Reference: Safari Web Content Guide: Handling Events)
	//IE9 claims that draggable is NOT in the element, but does allow drag and drop. (Reference: my testing HTML5 drag and drop in IE.)

	//from http://kangax.github.com/iseventsupported/
	function isEventSupported(eventName, element) {
		var TAGNAMES = {
			'select': 'input', 'change': 'input',
			'submit': 'form', 'reset': 'form',
			'error': 'img', 'load': 'img', 'abort': 'img'
		};
		element = element || document.createElement(TAGNAMES[eventName] || 'div');
		eventName = 'on' + eventName;
		
		var isSupported = (eventName in element);
		
		if (!isSupported) {
			// if it has no `setAttribute` (i.e. doesn't implement Node interface), try generic element
			if (!element.setAttribute) {
				element = document.createElement('div');
			}
			if (element.setAttribute && element.removeAttribute) {
				element.setAttribute(eventName, '');
				isSupported = typeof element[eventName] == 'function';

				// if property was created, "remove it" (by setting value to `undefined`)
				if (typeof element[eventName] != 'undefined') {
					element[eventName] = undefined;
				}
				element.removeAttribute(eventName);
			}
		}
		
		element = null;
		return isSupported;
	}

	var iOS = !!navigator.userAgent.match('iPhone OS') || !!navigator.userAgent.match('iPad');
	//正确的判断是否支持HTML5的拖拽方法 from Modernizr.js ：http://modernizr.github.com/Modernizr/annotatedsource.html
	var _supportHTML5DragDrop = !iOS && isEventSupported('dragstart') && isEventSupported('drop');

	/**
	 * 拖拽模块
	 */
	this.DragDrop = new Class(function() {

		//拖拽时会修改拖拽元素的默认样式
		var _modifiedPropertiesByDrag = ['display', 'position', 'width', 'height', 'border', 
				'backgroundColor', 'filter', 'opacity', 'zIndex', 'left', 'top'];
		//支持HTML5拖拽的浏览器下，自动draggable等于true的元素tag
		var _autoDraggableTags = ['IMG', 'A'];

		Class.mixin(this, events.Events);

		//屏蔽IE默认的拖拽行为
		if(ua.ua.ie) {
			document.ondragstart = returnFalse;
		}

		this.initialize = function(self) {
			//如果draggable元素的值为true，则模拟HTML5的行为，让元素可拖拽，并且触发一系列事件
			//IMG和A标签在支持HTML5拖拽的浏览器中默认是true的，因此需要特殊处理
			if (self.get('draggable') == true 
				&& (_autoDraggableTags.indexOf(self.tagName) == -1)) {
				//需要为document添加事件
				self.__docForDD = sys.modules['dom'].wrap(document);
				//bind事件，将bind后的函数作为事件监听
				self.__binderForDD = {
					checkDragging : self._checkDragging.bind(self),
					cancel : self._cancelDrag.bind(self),
					dragging: self._dragging.bind(self),
					finish: self._finishDrag.bind(self)
				}
				//为元素添加拖拽的相关行为
				self.set('draggable', true);
				//屏蔽当前拖拽元素下的A和IMG的拖拽行为，让元素的拖拽行为可以disable
				self._forbidAutoDraggableNodes();
			}
			//模拟放置行为(暂时dropzone还只是用来作为简单标识)
			if (self.get('dropzone') != undefined && self.get('dropzone') != "") { 
				self.set('dropzone', 'default');
			}
		};

		/**
		 * 定义draggable的获取和设置方法
		 */
		this.draggable = property(
			function(self){
				return self.draggable;
			}, 
			function(self, draggable){
				//设置元素的draggable为true
				self._set('draggable', draggable);
				if(draggable) {
					if(self.__canDrag == true) {
						return;
					}
					//为元素自身添加鼠标点击的监听
					self.addEvent('mousedown', self._handleMouseDownForDD, false);
					self.__canDrag = true;
					//如果已经有归属了，则不再重新计算
					if(self.__belongToDroppable	!= null) {
						return;
					}
					//保存所有的容器元素列表
					self.__droppables = [];
					//往上寻找自己所属的容器
					var parent = self.parentNode;
					while(parent && parent.tagName != 'BODY' && parent.tagName != 'HTML') {
						if(parent.dropzone != undefined && parent.dropzone != '') {
							parent = sys.modules['dom'].wrap(parent);
							self.__belongToDroppable = parent;
							self.__droppables.push(parent);
							break;
						}
						parent = parent.parentNode;
					}
				} else {
					if(self.__canDrag == true) {
						//去除自身的鼠标点击监听
						self.removeEvent('mousedown', self._handleMouseDownForDD, false);
						//保留当前所属容器和容器列表，为再次可拖拽做准备
						//self.__belongToDroppable = null;
						//self.__droppables = null;
						self.__canDrag = false;
					}
				}
			}
		);

		/**
		 * 定义dropzone的获取和设置方法
		 */
		this.dropzone = property(
			function(self){
				return self.dropzone;
			}, 
			function(self, dropzone){
				self._set('dropzone', dropzone);
				if(dropzone != undefined && dropzone != '') {
					if(self.__canDrop != true) {
						self.__canDrop = true;
					}	
				} else {
					if(self.__canDrop == true) {
						self.__canDrop = false;
					}
				}
			}
		);

		/**
		 * 获取容器列表
		 */	
		this.getDroppableList = function(self) {
			return self.__canDrag ? self.__droppables : null;
		}
		/**
		 * 获取当前所在的容器
		 */
		this.getCurrentDroppable = function(self) {
			return self.__canDrag ? self.__belongToDroppable : null;
		}

		/**
		 * 为容器添加其他可拖拽的元素（意味着其他元素可以拖放进入此容器）
		 *
		 * @param draggables  添加的可拖拽元素，元素本身必须是可拖拽的
		 * @param isInit 	  当前容器是否是这些可拖拽元素的初始容器
		 */
		this.addDraggables = function(self, draggables, isInit) {
			if(self.__canDrop != true) {
				return self;
			}
			isInit = isInit || false;
			if(!self.__draggables) {
				self.__draggables = [];
			}
			for(var i=0,l=draggables.length,current; i<l; i++) {
				current = draggables[i];
				if(!current._canDrag) {
					current.enableDrag();
				} 
				//如果新添加元素的容器列表中已经有当前元素了，则不需要重新再添加
				if(current.__droppables.indexOf(self) == -1) {
					current.__droppables.push(self);
				}
				if(isInit) {
					current.__belongToDroppable = self;
				}
			}
			return self;
		}

		/**
		 * 为当前可拖拽元素增加一个新的可放置容器
		 *
		 * @param droppable 新增加的容器对象
		 * @param isInit	是否作为初始容器（draggable元素的当前容器）
		 */
		this.addDroppable = function(self, droppable, isInit) {
			if(self.__canDrag != true) {
				return self;
			}
			isInit = isInit || false;
			self.__droppables = self.__droppables || [];
			//放入容器列表
			self.__droppables.push(droppable);
			if(isInit) {
				//将此容器作为初始容器
				self.__belongToDroppable = droppable;
			}
			return self;
		}

		if(_supportHTML5DragDrop) {
			/**
			 * 屏蔽当前可拖拽元素的所有A，IMG元素的拖拽行为
			 */
			this._forbidAutoDraggableNodes = function(self) {
				if(self.__canDrag != true) {
					return self;
				}
				//获取子元素
				var subNodes = sys.modules['dom'].getElements(_autoDraggableTags.join(','), self);
				for(var i=0,l=subNodes.length; i<l; i++) {
					subNodes[i].draggable = false;
				}
				return self;
			}
		} else {
			/**
			 * 如果不支持HTML5的拖拽，则不需要屏蔽
			 */
			this._forbidAutoDraggableNodes = function(self) {
				return self;
			}
		}


		/**
		 * 考虑框架页对事件addEvent方法的影响，封装为document元素添加事件的方法
		 * 但是在dom模块中增加了对页面框架模块asyncHTMLManager的判断，不是好的解决方案
		 */	
		this._addEventToDoc = function(self, type, callback, bubble) {
			//如果有页面框架模块，则采用覆盖前的addEvent
			var addEvent = window.asyncHTMLManager ?
				window.asyncHTMLManager.dom.Element.prototype.addEvent : self._doc.addEvent;

			addEvent.call(self.__docForDD, type, callback, bubble);
		}

		/**
		 * 考虑框架页对事件removeEvent方法的影响，封装为document元素删除事件的方法
		 */	
		this._removeEventFromDoc = function(self, type, callback, bubble) {
			//如果有页面框架模块，则采用覆盖前的removeEvent
			var removeEvent = window.asyncHTMLManager ?
				window.asyncHTMLManager.dom.Element.prototype.removeEvent : self._doc.removeEvent;

			removeEvent.call(self.__docForDD, type, callback, bubble);
		}	

		/**
		 * 处理鼠标的点击以后的拖拽行为
		 *
		 * @param e 点击发生时的事件对象
		 */
		this._handleMouseDownForDD = function(self, e) {	
			//阻止默认行为，让代码控制拖拽行为
			if(e.preventDefault) e.preventDefault();
			if(e.stopPropagation) e.stopPropagation();
			
			var mousePos = getMousePos(e);
			var selfPos = self.position();
			//初始的鼠标位置
			self.__originMouseX = mousePos.x;
			self.__originMouseY = mousePos.y;
			//初始的元素坐标位置(top, left)，用于解决chrome浏览器的拖拽位置不变认为是单击的问题
			if(ua.ua.chrome) {
				self.__originX = selfPos.x;
				self.__originY = selfPos.y;
				//确保chrome下添加的click事件一定被移除了，这里不会抛出异常
				self.removeEvent('click', fixChromeClick, false);
			}
			//用于拖拽时，定位元素相对于鼠标指针的位置
			self.__deltaX = mousePos.x - selfPos.x;
			self.__deltaY = mousePos.y - selfPos.y;

			//触发draginit事件，HTML5标准钟并没有此事件，因此暂不触发
			//self.fireEvent('draginit', {dragging:self, event:e});

			//给document的mousemove 和 mouseup加上事件
			self._addEventToDoc('mousemove', self.__binderForDD.checkDragging, false);
			self._addEventToDoc('mouseup', self.__binderForDD.cancel, false);

			//屏蔽拖拽元素的选择行为
			self.__selectionEventName = ua.ua.ie ? 'selectstart' : 'mousedown';
			self._addEventToDoc(self.__selectionEventName, returnFalse, false); 
		}

		/**
		 * 根据鼠标的移动距离，判断是否已经开始拖拽
		 *
		 * 初始情况下为document的mousemove方法添加的是checkDragging，判断是否是拖拽操作
		 * 如果开始拖拽，再将checkDragging改为dragging，正式执行拖拽的功能
		 *
		 * @param e 事件对象
		 */	
		this._checkDragging = function(self, e) {
			//在IE下，如果拖动非常迅速时，鼠标变成禁止符号，这里需要禁止默认事件的发生
			if(e.preventDefault) e.preventDefault();
			
			//计算鼠标移动的距离，如果大于某一个阈值，则认为开始拖动
			//这是Mootools的方案，Kissy还提供了一种鼠标点击持续事件的判断，如果大于200ms，说明是拖拽
			var mousePos = getMousePos(e);
			var distance = Math.round(Math.sqrt(Math.pow(mousePos.x - self.__originMouseX, 2) + 
					Math.pow(mousePos.y - self.__originMouseY, 2)));
			//说明开始拖拽了
			if(distance > 3) {
				//把mousemove由检查拖拽改为执行拖拽，把mouseup由取消改为完成
				self._removeEventFromDoc('mousemove', self.__binderForDD.checkDragging, false);
				self._removeEventFromDoc('mouseup', self.__binderForDD.cancel, false);
				self._addEventToDoc('mousemove', self.__binderForDD.dragging, false);
				self._addEventToDoc('mouseup', self.__binderForDD.finish, false);
			
				//给元素添加拖拽时候的基本样式
				addDraggingStyle(self);

				//触发dragstart事件，参考HTML5规范
				self.fireEvent('dragstart', {dragging:self, event:e});

				//这里也触发所属元素的dropinit事件
				//dropinit不是HTML5规范规定的，但是也是有必要的
				//dragstart, drag, dragend是draggable元素的完整生命周期，
				//但是如果没有dropinit，droppable元素只有dropenter, dropover, dropleave, drop，没有初始状态，不完整
				//具体示例：如果在拖拽初始时需要创建占位元素，如果没有dropinit，就只能针对每一个元素的dragstart编写代码了
				if(self.__belongToDroppable) {
					self.__belongToDroppable.fireEvent('dropinit', {dragging:self, event:e});
				}
			}
		}

		/**
		 * 拖拽时的事件处理方法
		 *
		 * @param e 事件对象
		 */
		this._dragging = function(self, e) {
			//阻止默认事件
			if(e.preventDefault) e.preventDefault();

			//利用鼠标位置，修改拖拽元素的位置
			var mousePos = getMousePos(e);
			self.style.left = (mousePos.x - self.__deltaX) + 'px';
			self.style.top  = (mousePos.y - self.__deltaY) + 'px';
			//触发drag事件，遵循HTML5规范
			self.fireEvent('drag', {dragging:self, event:e});

			//计算当前元素的具体位置坐标
			var selfPos = self.position();
			var draggingCoordinates = {
				top: selfPos.y,
				left: selfPos.x,
				right: selfPos.x + parseInt(self.getStyle('width')),
				bottom: selfPos.y + parseInt(self.getStyle('height'))
			}

			//针对每一个容器，检查当前元素是否在容器当中
			for(var i=0,current,currentPos,containerCoordinates,l=self.__droppables.length; i<l; i++) {
				current = self.__droppables[i];

				//计算每一个容器的边界
				currentPos = current.position();
				containerCoordinates = {
					top: currentPos.y,
					left: currentPos.x,
					right: currentPos.x + parseInt(current.getStyle('width')),
					bottom: currentPos.y + parseInt(current.getStyle('height'))
				}
				
				//判断容器的关系
				if(current == self.__belongToDroppable) {
					//如果容器是拖拽元素所属容器
					if(isInContainer(containerCoordinates, draggingCoordinates)) {
						//如果还在容器内，说明在所属容器内部移动，触发dragover事件
						current.fireEvent('dragover', {from:current, to:current, dragging:self});
					} else {
						//如果不在容器内，说明从所属容器中移出，触发dragleave事件
						current.fireEvent('dragleave', {from:current, to:null, dragging:self});
						self.__belongToDroppable = null;
					}
				//如果容器不是拖拽元素所属容器
				} else if(isInContainer(containerCoordinates, draggingCoordinates)) {
					//如果拖拽元素所属容器不为空，说明从拖拽容器中脱离出来了(是不是会跟上面事件触发有重复?试验还没出现这种情况)
					if(self.__belongToDroppable) {
						self.__belongToDroppable.fireEvent('dragleave', {from:self.__belongToDroppable, to:current, dragging:self});
					}
					//进入此容器了，触发dragenter
					//注意元素初始情况下会属于某个容器，初始化的时候要记录，避免错误的触发dragenter，mootools貌似没有判断
					current.fireEvent('dragenter', {from:self.__belongToDroppable, to:current, dragging:self});
					self.__belongToDroppable = current;
				}
			}	
		}

		/**
		 * 拖拽完成时调用的方法
		 *
		 * @param e 事件对象
		 */
		this._finishDrag = function(self, e) {
			if(e.preventDefault) e.preventDefault();

			//拖拽已完成，去除给document添加的一系列事件
			self._removeEventFromDoc('mousemove', self.__binderForDD.dragging, false);
			self._removeEventFromDoc('mouseup', self.__binderForDD.finish, false);
			self._removeEventFromDoc(self.__selectionEventName, returnFalse, false); 

			//去除基本的拖拽样式设置
			removeDraggingStyle(self);
			//如果元素属于某个容器，则触发该容器的drop事件
			if(self.__belongToDroppable) {
				self.__belongToDroppable.fireEvent('drop', {dragging:self, event:e});
			}
			//触发dragend事件，按照HTML5的标准，应该在容器drop事件之后触发
			self.fireEvent('dragend', {dragging:self, event:e});
			
			if(ua.ua.chrome) {
				//获取当前位置(应该放在drop和dropend事件之后，因为在这两个事件中可以继续调整元素的位置)
				var pos = self.position();
				//如果没有发生变化，则屏蔽chrome的click事件，避免再次请求页面
				if(pos.x == self.__originX && pos.y == self.__originY) {
					self.addEvent('click', fixChromeClick, false);
				}	
			}
		}

		/**
		 * 取消拖拽操作，在checkDragging的过程中已经释放鼠标，说明并不是拖拽
		 *
		 * @param e 事件对象
		 */
		this._cancelDrag = function(self, e) {
			//去除为document添加的所有事件
			self._removeEventFromDoc('mousemove', self.__binderForDD.checkDragging, false);
			self._removeEventFromDoc('mouseup', self.__binderForDD.cancel, false);
			self._removeEventFromDoc(self.__selectionEventName, returnFalse, false); 

			//触发取消事件（HTML5中没有此事件，Mootools中有）
			self.fireEvent('cancel', {dragging:self, event:e});	
		}

		/********************************* DragDrop的辅助方法 ************************************/

		/**
		 * 为屏蔽Chrome下拖拽再放回原处认为是单击的问题，这里将click事件进行屏蔽
		 *
		 * @param e 事件对象
		 */
		function fixChromeClick(e) {
			//点击以后马上移除
			this.removeEvent('click', arguments.callee, false);
			//阻止默认执行和冒泡
			e.preventDefault();
			e.stopPropagation();
		}

		/**
		 * 为元素增加拖拽时的样式设置
		 *
		 * @param element 拖拽的元素
		 */
		function addDraggingStyle(element) {
			//备份元素在拖拽之前的属性值
			element.oldStyle = {};
			var currentStyle = element.style;
			_modifiedPropertiesByDrag.forEach(function(prop) {
				element.oldStyle[prop] = currentStyle[prop];
			});
			//设置拖拽元素的基本属性
			element.style.display = 'block';
			//width和height一定要在设置position属性之前获取
			element.style.width = parseInt(element.getStyle('width')) + 'px';
			element.style.height = parseInt(element.getStyle('height')) + 'px';
			element.style.position = 'absolute';
			element.style.backgroundColor = '#ccc';
			if(ua.ua.ie) {
				element.style.filter = 'Alpha(opacity=70)';
			} else {
				element.style.opacity = '0.7';
			}
			element.style.zIndex = '10000';	
		}

		/**
		 * 为元素去除拖拽的样式设置
		 *
		 * @param element 拖拽的元素
		 */
		function removeDraggingStyle(element) {
			_modifiedPropertiesByDrag.forEach(function(prop) {
				element.style[prop] = element.oldStyle[prop];
			});
			element.oldStyle = null;
		}

		/**
		 * 获取鼠标的具体位置坐标（完善此方法）
		 *
		 * @param ev 事件对象
		 */ 
		function getMousePos(ev) {
			return {
				x : (ev.pageX != null) ? ev.pageX : ev.clientX + document.body.scrollLeft - document.body.clientLeft,
				y : (ev.pageY != null) ? ev.pageY : ev.clientY + document.body.scrollTop  - document.body.clientTop
			};		
		}

		/**
		 * 根据两个坐标位置，判断dragging是否在container中
		 *
		 * @param container 容器
		 * @param dragging  拖拽元素
		 *
		 * TODO 目前只是简单的判断了垂直方向的位置，还应该引入更加完善的判断方式
		 */
		function isInContainer(container, dragging) {
			return dragging.bottom >= container.top && dragging.top <= container.bottom; 
		}

		/**
		 * 辅助方法，用于作为事件监听
		 */
		function returnFalse() {
			return false;
		}

		/**
		 * 获取元素的属性值
		 *
		 * @param style 属性名称
		 *
		 * @returns 属性名称对应的属性值
		 *
		 * 此方法来自XN.element
		 */
		this.getStyle = function(self, style) {
			if(ua.ua.ie) {
				style = (style == 'float' || style == 'cssFloat') ? 'styleFloat' : style;
				var value = self.style[style];
				if (!value && self.currentStyle) value = self.currentStyle[style];
			
				if (style == 'opacity') {
					if (value = (self.style['filter'] || '').match(/alpha\(opacity=(.*)\)/)) {
						if (value[1]) {
							return parseFloat(value[1]) / 100;
						}
					}
					return 1.0;
				}
				if (value == 'auto') {
					if ((style == 'width' || style == 'height') && (self.getStyle('display') != 'none')) {
						return self['offset'+ (style == 'width' ? 'Width' : 'Height')] + 'px';
					}
					return null;
				}
				return value;
			} else {
				style = style == 'float' ? 'cssFloat' : style;
				var value = self.style[style];
				if (!value) {
					var css = document.defaultView.getComputedStyle(self, null);
					value = css ? css[style] : null;
				}
				if (style == 'opacity') return value ? parseFloat(value) : 1.0;
				return value == 'auto' ? null : value;
			}
		};

		/**
		 * 获取元素的具体位置信息
		 * 此方法来自网络，需要参考标准获取方法和其他框架内容，再完善 
		 * @return 形如{x:xxx, y:xxx}的位置信息对象，x是横向坐标，y是纵向坐标
		 */
		this.position = function(self){
			if(self.parentNode === null || self.style.display == 'none') {
				return false;
			}

			var parent = null;
			var pos = [];
			var box;
		 
			if(self.getBoundingClientRect) {     //IE    
				box = self.getBoundingClientRect();
				var scrollTop = Math.max(document.documentElement.scrollTop, document.body.scrollTop);
				var scrollLeft = Math.max(document.documentElement.scrollLeft, document.body.scrollLeft); 
				return {x : box.left + scrollLeft, y : box.top + scrollTop};
			} else if(document.getBoxObjectFor) {    // gecko
				box = document.getBoxObjectFor(self);            
				var borderLeft = (self.style.borderLeftWidth) ? parseInt(self.style.borderLeftWidth) : 0;
				var borderTop = (self.style.borderTopWidth) ? parseInt(self.style.borderTopWidth) : 0; 
				pos = [box.x - borderLeft, box.y - borderTop];
			} else {    // safari & opera   
				pos = [self.offsetLeft, self.offsetTop];
				parent = self.offsetParent;
				if (parent != self) {
					while (parent) {
						pos[0] += parent.offsetLeft;
						pos[1] += parent.offsetTop;
						parent = parent.offsetParent;
					}
				}
				if (ua.ua.opera  
					|| ( ua.ua.safari && self.style.position == 'absolute' )) { 
					pos[0] -= document.body.offsetLeft;
					pos[1] -= document.body.offsetTop;
				}  
			}
				 
			parent = self.parentNode || null;

			while (parent && parent.tagName != 'BODY' && parent.tagName != 'HTML') { 
				// account for any scrolled ancestors
				pos[0] -= parent.scrollLeft;
				pos[1] -= parent.scrollTop;   
				parent = parent.parentNode; 
			}
			return {x:pos[0], y:pos[1]};
		};
	});

});
object.add('./net.js', 'dom, events', function(exports, dom, events) {

var ajaxProxies = this.ajaxProxies = {};

/**
 * 执行一个可跨域的ajax请求
 * 跨域host必须有ajaxproxy.htm
 * callback唯一参数返回 XMLHttpRequest 对象实例
 */
this.ajaxRequest = function(url, callback) {
	if (!url || typeof url != 'string' || url.trim().length == 0) {
		return;
	}
	if (!callback || typeof callback != 'function') {
		callback = function(){};
	}
	var tmpA = document.createElement('a');
	tmpA.href = url;
	var hostname = tmpA.hostname;
	var protocol = tmpA.protocol;

	if (hostname && (hostname != location.hostname)) {
		var xhr = null;
		if (ajaxProxies[hostname]) callback(ajaxProxies[hostname].getTransport());
		else {
			var iframe = document.createElement('iframe');
			iframe.style.display = 'none';
			dom.ready(function() {
				document.body.insertBefore(iframe, document.body.firstChild);
				iframe.src = protocol + '//' + hostname + '/ajaxproxy.htm';
				if (iframe.attachEvent) {
					iframe.attachEvent('onload', function () {
						try {
							var transport = iframe.contentWindow.getTransport();
						} catch (e) {
							throw new Error('message : ' + e.message + ' from url : ' + url);
						}
						// ajaxProxies先缓存，避免callback异常导致缓存没有执行
						ajaxProxies[hostname] = iframe.contentWindow;
						callback(transport);
					});
				} else {
					iframe.onload = function () {
						try {
							var transport = iframe.contentWindow.getTransport();
						} catch (e) {
							throw new Error('message : ' + e.message + ' from url : ' + url);
						}
						// ajaxProxies先缓存，避免callback异常导致缓存没有执行
						ajaxProxies[hostname] = iframe.contentWindow;
						callback(transport);
					};
				}
			});
		}
	} else {
		if (window.ActiveXObject) {
			try {
				callback(new ActiveXObject('Msxml2.XMLHTTP'));
			} catch(e) {
				callback(new ActiveXObject('Microsoft.XMLHTTP'));
			}
		} else callback(new XMLHttpRequest());
	}
};

/**
 * 发送一个请求到url
 * @param url url
 */
this.ping = function(url) {
	var n = "_net_ping_"+ (new Date()).getTime();
	var c = window[n] = new Image(); // 把new Image()赋给一个全局变量长期持有
	c.onload = (c.onerror=function(){window[n] = null;});
	c.src = url;
	c = null; // 释放局部变量c
};

/**
 * 发送Ajax请求的类
 * 使用时需要实例化一个Request对象,然后手动调用该对象的send方法完成发送(与base中的xmlhttp不同)
 * 
 * @param {object} options
 * @param {string} options.url 要请求的url
 * @param {string} options.method get/post
 * @param {function} options.onsuccess 请求成功后的回调,参数是封装过的ajax对象
 * @param {function} options.onerror 请求失败后的回调
 * @param {int} options.timeout 请求的超时毫秒数
 */
this.Request = new Class(function() {

	this.__mixins__ = [events.Events];

	this.initialize = function(self, options) {
		options = options || {};
		self.url = options.url || '';
		self.method = options.method || 'get';
		self.timeout = options.timeout && options.timeout > 0 ? options.timeout : 0;
		self.headers = {};
		self.data = options.data || null;
		self._xhr = null;

		self.onSuccess = options.onSuccess;
		self.onsuccess = options.onsuccess;
		self.onerror = options.onerror;
		self.oncomplete = options.oncomplete;
	};

	/**
 	 * 将data作为数据进行发送
	 * @param {string} data 发送的数据
	 */
	this.send = function(self, data) {
		exports.ajaxRequest(self.url, function(xhr) {
			// onreadystatechange和timer共同使用的标志
			// 异常出现的情形：
			// 	在设置timeout极短（1ms）时，timer首先执行，timeout事件触发，在abort执行之前，xhr已经成功返回结果，触发success
			//  这样一个请求既触发timeout又触发success，不正确
			// 增加callbackCalled就是为了避免上述情形的出现
			var callbackCalled = false;
			self._xhr = xhr;
			var eventData = {request: self};

			xhr.onreadystatechange = function() {
				var xhr = self._xhr;

				if (xhr.readyState === 4) {


					// 如果timer已经抢先执行，则直接返回
					if (callbackCalled) {
						return;
					} 
					// 如果timer还没有执行，则清除timer
					else if (self._timer) {
						clearTimeout(self._timer);
						self._timer = null;
					}

					// IE6 don't support getResponseHeader method
					// if (xhr.getResponseHeader('Content-Type') == 'text/json') {
						//xhr.responseJSON = JSON.parse(xhr.responseText)
					// }

					self.responseText = xhr.responseText;
					self.responseXML = xhr.responseXML;
					// self.responseJSON = xhr.responseJSON;

					// Compatible
					eventData.responseText = xhr.responseText;
					eventData.responseXML = xhr.responseXML;

					if (xhr.status === undefined || xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) {
						self.fireEvent('success', eventData);
						if (self.onSuccess) self.onSuccess(eventData);
					} else {
						self.fireEvent('error', eventData);
					}
					self.fireEvent('complete', eventData);
				}
			};
			var xhr = self._xhr;
			var url = self.url;

			if (!data) data = self.data;

			// 处理data
			if (data && self.method == 'get') {
				url += (url.indexOf('?') != -1 ? '&' : '?') + data;
				data = null;
			}

			// open
			xhr.open(self.method, url, true);

			xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

			// headers
			for (var name in self.headers) {
				xhr.setRequestHeader(name, self.headers[name]);
			}

			if (self.timeout) {
				self._timer = setTimeout(function() {
					callbackCalled = true;
					self.abort();
					self.fireEvent('timeout', eventData);
					self.fireEvent('complete', eventData);
				}, self.timeout);
			}

			self._xhr.send(data);
		});
	};

	/**
	 * 中断请求
	 */
	this.abort = function(self) {
		if (self._xhr) {
			self._xhr.abort();
		}
		if (self._timer) {
			clearTimeout(self._timer);
			self._timer = null;
		}
	};

	/**
	 * getResponseHeader
	 */
	this.getResponseHeader = function(self, key) {
		return self._xhr.getResponseHeader(key);
	};

	/**
	 * setHeader
	 */
	this.setHeader = function(self, name, value) {
		self.headers[name] = value;
	};

});

});
object.add('./mvc.js', 'events', function(exports, events) {


/**
 * MVC Action 基类
 * @class
 */
this.Action = new Class(events.Events, function() {

	/**
	 * initialize
	 */
	this.initialize = function(self) {
		events.Events.initialize(self);

		self.view = null;
	};

	/**
	 * execute
	 */
	this.execute = function(self, view) {
		self.view = view;
		view.load(self);
	};

});

});

object.define('ui/index.js', 'string, options, dom, events', function(require, exports) {

var string = require('string');
var options = require('options');
var dom = require('dom');
var events = require('events');

/**
 * Element
 */
var Element = new Class(function() {

	Class.keys(dom.Element).forEach(function(name) {
		var member = dom.Element.get(name);
		if (['initialize'].indexOf(name) != -1) return;
		if (typeof member != 'function') return;

		this[name] = function(self) {
			var args = [];
			var arg;
			// 代理方法支持Component参数
			for (var i = 1; i < arguments.length; i++) {
				arg = arguments[i];
				args.push((arg && arg._node)? arg._node : arg);
			}
			return dom.Element.prototype[name].apply(self._node, args);
		};
	}, this);

});

/**
 * 一组Component的包装
 */
this.Components = new Class(Array, function() {

	/**
	 * @param elements wrapped dom elements
	 * @param type 这批节点的共有Component类型，默认为Component
	 */
	this.initialize = function(self, elements, type, options) {
		if (!type) type = exports.Component;

		for (var i = 0; i < elements.length; i++) {
			self.push(new type(elements[i], options));
		}

		Class.keys(type).forEach(function(name) {
			if (typeof type.prototype[name] != 'function') return;

			self[name] = function() {
				var element;
				//var i, arg, args = [];
				// 代理方法支持Component参数
				//for (i = 0; i < arguments.length; i++) {
				//arg = arguments[i];
				//args.push((arg && arg._node)? arg._node : arg);
				//}
				for (i = 0; i < self.length; i++) {
					element = self[i];
					if (typeof element[name] == 'function') {
						element[name].apply(self[i], arguments);
					}
				}
			};
		});

		self.set = function(key, value) {
			for (var i = 0; i < self.length; i++) {
				self[i].set(key, value);
			}
		};

		self.get = function(key) {
			var result = [];
			for (var i = 0; i < self.length; i++) {
				result.push(self[i].get(key));
			}
			return result;
		};
	};

});

/**
 * 为一个Component定义一个sub components引用
 * 用法：
 * MyComponent = new Class(ui.Component, {
 *	refname: ui.define('css selector', ui.menu.Menu)
 * });
 * 这样MyComponent实例的refname属性极为相对应selector获取到的节点引用
 * @param selector 选择器
 * @param type 构造类
 * @param single 是否是单独的引用
 */
this.define = function(selector, type, single) {
	var prop = property(function(self) {
		return self[prop.__name__];
	});
	prop.isComponent = true;
	prop.selector = selector;
	prop.type = type || exports.Component;
	prop.single = single;
	return prop;
};

/**
 * 定义唯一引用的sub component
 */
this.define1 = function(selector, type) {
	return exports.define(selector, type, 1);
};

var getConstructor = function(type) {
	if (type === 'number') return Number;
	else if (type === 'string') return String;
	else if (type === 'boolean') return Boolean;
};

/**
 * 声明一个option
 * 用法：
 * MyComponent = new Class(ui.Component, {
 *	myConfig: ui.option(1)
 * });
 * 这样MyComponent实例的myConfig属性值即为默认值1，可通过 set 方法修改
 */
this.option = function(defaultValue, getter, setter) {
	var prop;
	function fget(self) {
		return self.getOption(prop.__name__);
	}
	function fset(self, value) {
		return self.setOption(prop.__name__, value);
	}
	prop = property(fget, fset);
	prop.isOption = true;
	prop.defaultValue = defaultValue;
	prop.getter = getter || function(self, name, defaultValue) {
		var value = self._node.getData(name.toLowerCase());
		if (value) return getConstructor(typeof defaultValue)(value);
	};
	prop.setter = setter;
	return prop;
};

// metaclass
this.component = new Class(type, function() {

	this.__new__ = function(cls, name, base, dict) {

		if (dict.__metaclass__) {
			dict.__defaultOptions = []; // 默认options
			dict.__subs = [];
			dict.__subEvents = {}; // 通过subName_eventType进行注册的事件
			dict.__onEvents = []; // 通过oneventtype对宿主component注册的事件 // 通过oneventtype对宿主component注册的事件 // 通过oneventtype对宿主component注册的事件 // 通过oneventtype对宿主component注册的事件
			dict.__handles = ['init', 'destory', 'invalid', 'error', 'revert', 'reset']; // 定义的会触发事件的方法集合, revert, reset为兼容处理 Compatible
			dict.__methods = [];
		} else {
			dict.__defaultOptions = [];
			dict.__subs = [];
			dict.__subEvents = {};
			dict.__onEvents = [];
			dict.__handles = [];
			dict.__methods = [];

			Object.keys(dict).forEach(function(name) {
				if (name == 'initialize' || name.indexOf('__') == 0) return;
				var member = dict[name];

				// member有可能是null
				if (member != null && member.__class__ === property) {
					if (member.isComponent) {
						dict.__subs.push(name);
					} else if (member.isOption) {
						dict.__defaultOptions.push(name);
					}
				} else if (typeof member == 'function') {
					if (name.match(/^(_?[a-zA-Z]+)_([a-zA-Z]+)$/)) {
						(dict.__subEvents[RegExp.$1] = dict.__subEvents[RegExp.$1] || []).push(RegExp.$2);

					} else if (name.match(/^on([a-zA-Z]+)$/)) {
						dict.__onEvents.push(RegExp.$1);

					} else if (name.slice(0, 1) == '_' && name.slice(0, 2) != '__' && name != '_set') { // _xxx but not __xxx
						dict.__handles.push(name.slice(1));

					} else {
						dict.__methods.push(name);
					}
				}
			});
		}

		return type.__new__(cls, name, base, dict);
	};

	this.initialize = function(cls, name, base, dict) {

		var proto = cls.prototype;
		var baseProto = base.prototype;

		proto.__handles.forEach(function(eventType) {
			cls.set(eventType, events.fireevent(function(self) {
				return cls.get('_' + eventType).apply(cls, arguments);
			}));
		});

		if (base && baseProto.addons) {
			proto.addons.push.apply(proto.addons, baseProto.addons);
		}

		if (proto.addons) {
			proto.addons.forEach(function(comp) {
				if (!comp) throw new Error('bad addon');

				var compProto = comp.prototype;
				compProto.__defaultOptions.forEach(function(name) {
					var defaultOptions = proto.__defaultOptions;
					if (defaultOptions.indexOf(name) != -1) return;
					defaultOptions.push(name);
					cls.set(name, comp.get(name));
				});

				compProto.__subs.forEach(function(name) {
					var subs = proto.__subs;
					if (subs.indexOf(name) != -1) return;
					subs.push(name);
					cls.set(name, comp.get(name));
				});

				compProto.__handles.forEach(function(eventType) {
					var handles = proto.__handles;
					var methodName = '_' + eventType;
					if (handles.indexOf(eventType) != -1) return;
					handles.push(eventType);
					cls.set(eventType, compProto[eventType].im_func);
					cls.set(methodName, compProto[methodName].im_func);
				});

				compProto.__methods.forEach(function(name) {
					var methods = proto.__methods;
					if (methods.indexOf(name) != -1) return;
					methods.push(name);
					cls.set(name, compProto[name].im_func);
				});
				// onEvents和subEvents在宿主中处理，方法不添加到宿主类上
			});
		}

		if (base && base !== Object) {
			baseProto.__defaultOptions.forEach(function(name) {
				var defaultOptions = proto.__defaultOptions;
				if (defaultOptions.indexOf(name) == -1) defaultOptions.push(name);
			});

			baseProto.__subs.forEach(function(name) {
				var subs = proto.__subs;
				if (subs.indexOf(name) == -1) subs.push(name);
			});

			baseProto.__handles.forEach(function(eventType) {
				var handles = proto.__handles;
				if (handles.indexOf(eventType) == -1) proto.__handles.push(eventType);
			});

			baseProto.__methods.forEach(function(name) {
				var methods = proto.__methods;
				if (methods.indexOf(name) == -1) methods.push(name);
			});

			Object.keys(baseProto.__subEvents).forEach(function(subName) {
				var subEvents = proto.__subEvents;
				baseProto.__subEvents[subName].forEach(function(eventType) {
					var subEvent = subEvents[subName];
					if (subEvent && subEvent.indexOf(eventType) != -1) return;
					(subEvents[subName] = subEvents[subName] || []).push(eventType);
				});
			});

			baseProto.__onEvents.forEach(function(eventType) {
				var onEvents = proto.__onEvents;
				if (onEvents.indexOf(eventType) == -1) onEvents.push(eventType);
			});
		}
	};
});

/**
 * UI模块基类，所有UI组件的基本类
 */
this.Component = new Class(function() {

	this.__metaclass__ = exports.component;

	this.__mixins__ = [Element];

	this.initialize = function(self, node, options) {
		if (!node.nodeType) {
			if (typeof node == 'string') {
				node = {
					template: node
				};
			}
			var data = {};
			self.__defaultOptions.forEach(function(key) {
				if (options[key] === undefined) data[key] = self.get(key);
			});
			object.extend(data, options);

			var tdata;
			if (node.section) {
				tdata = {};
				tdata[node.section] = data;
			} else {
				tdata = data;
			}
			var str = string.substitute(node.template, tdata);
			node = dom.Element.fromString(str);
			if (!node) {
				throw new Error('render component error with template.');
			}
		}

		self.__nodeMap = {}; // 相应node的uid对应component，用于在需要通过node找到component时使用
		self.__rendered = {}; // 后来被加入的，而不是首次通过selector选择的node的引用

		self._node = dom.wrap(node);

		self.__initOptions(options);
		self.__initEvents();
		self.__initSubs();
		self.__initAddons();
		self.init();
	};

	this.__initAddons = function(self) {
		if (!self.addons) return;
		self.addons.forEach(function(addon) {
			addon.get('init')(self);
		});
	};

	/**
	 * 加入addon中用onxxx方法定义的事件
	 */
	this.__initEvents = function(self) {
		if (!self.addons) return;
		self.addons.forEach(function(addon) {
			addon.prototype.__onEvents.forEach(function(eventType) {
				var trueEventType; // 正常大小写的名称
				if (self.__handles.some(function(handle) {
					if (handle.toLowerCase() == eventType) {
						trueEventType = handle;
						return true;
					}
					return false;
				})) {
					self.addEvent(trueEventType, function(event) {
						// 将event._args pass 到函数后面
						var args = [self, event].concat(event._args);
						addon.get('on' + eventType).apply(addon, args);
					});
				}
			});
		});
	};

	this.__initOptions = function(self, options) {
		if (!options) options = {};
		self._options = {};
		Object.keys(options).forEach(function(name) {
			// 浅拷贝
			// object在subcomponent初始化时同样进行浅拷贝
			self._options[name] = options[name];
		});

		self.__defaultOptions.forEach(function(name) {
			var sub = self.__properties__[name];
			// 从dom获取配置
			var defaultValue = sub.defaultValue;
			var value = sub.getter(self, name, defaultValue);

			if (value) {
				self.__setOption(name, value);
			}
			// 从options参数获取配置
			else if (options[name]) {
				self.__setOption(name, options[name]);
			}
			// 默认配置
			else {
				self.__setOption(name, defaultValue);
			}

			// 注册 option_change 等事件
			var bindEvents = function(events, cls) {
				if (events) {
					events.forEach(function(eventType) {
						var fakeEventType = '__option_' + eventType + '_' + name;
						var methodName = name + '_' + eventType;
						self.addEvent(fakeEventType, function(event) {
							// 注意这个self是调用了此addon的类的实例，而不是addon的实例，其__this__并不是addon的；
							// 必须通过cls调用addon上的方法，在相应方法中才能获取到正确的__this__；
							// if (cls) cls.prototype[methodName].call(self, event.value);
							// 上面这种调用方法由于获取的self.__this__，不正确。
							// 改成下面这种
							if (cls) cls.get(methodName).call(cls, self, event.value);
							// 调用自己的
							else self[methodName](event.value);
						});
					});
				}
			};

			bindEvents(self.__subEvents[name]);
			if (self.addons) {
				self.addons.forEach(function(addon) {
					bindEvents(addon.prototype.__subEvents[name], addon);
				});
			}

		});
	};

	this.__initSubs = function(self) {
		// TODO 这里修改了__properties__中的成员，导致如果某一个组件实例修改了类，后面的组件就都变化了。
		self.__subs.forEach(function(name) {
			var sub = self.__properties__[name];

			var options = self._options[name];
			// 从options获取子元素的扩展信息
			if (options && options.addons) {
				sub.type = new Class(sub.type, function() {
					options.addons.forEach(function(addon) {
						exports.addon(this, addon);
					}, this);
				});
			}

			self.__initSub(name, self.__querySub(name));
		});
	};

	/**
	 * 根据sub的定义获取component的引用
	 */
	this.__initSub = function(self, name, nodes) {
		if (!self._node) return null;

		var sub = self.__properties__[name];
		var comps;
		var options = self._options[name];

		if (sub.single) {
			if (nodes) {
				comps = new sub.type(nodes, options);
				self.__fillSub(name, comps);
			}
		} else {
			if (nodes) {
				comps = new exports.Components(nodes, sub.type, options);
				comps.forEach(function(comp) {
					self.__fillSub(name, comp);
				});
			} else {
				// 没有的也留下一个空的Components
				comps = new exports.Components([], sub.type);
			}
		}

		self['_' + name] = nodes;
		self._set(name, comps);

		return comps;
	};

	/**
	 * 将一个comp的信息注册到__subs上
	 */
	this.__fillSub = function(self, name, comp) {
		var sub = self.__properties__[name];
		var node = comp._node;
		self.__addNodeMap(name, String(node.uid), comp);
		comp = self.__nodeMap[name][String(node.uid)];

		// 注册 option_change 等事件
		var bindEvents = function(events, cls) {
			if (events) {
				events.forEach(function(eventType) {
					var methodName = name + '_' + eventType;
					node.addEvent(eventType, function(event) {
						// 调用addon上的
						// 注意这个self是调用了此addon的类的实例，而不是addon的实例，其__this__并不是addon的；
						// 必须通过cls调用addon上的方法，在相应方法中才能获取到正确的__this__；
						// if (cls) cls.prototype[methodName].apply(self, [event, comp].concat(event._args));
						// 上面这种调用方法由于获取的self.__this__，不正确。
						// 改成下面这种
						if (cls) cls.get(methodName).apply(cls, [self, event, comp].concat(event._args));
						// 调用自己的
						else self[methodName].apply(self, [event, comp].concat(event._args));
					});
				});
			}
		};

		bindEvents(self.__subEvents[name]);
		if (self.addons) {
			self.addons.forEach(function(addon) {
				bindEvents(addon.prototype.__subEvents[name], addon);
			});
		}
	};

	/**
	 * 获取sub的节点
	 */
	this.__querySub = function(self, name) {
		var sub = self.__properties__[name];
		if (typeof sub.selector == 'function') {
			return sub.selector(self);
		} else {
			return sub.single? self._node.getElement(sub.selector) : self._node.getElements(sub.selector);
		}
	};

	this.__setOption = function(self, name, value) {
		var pname = '_' + name;
		self[pname] = value;
		self._set(name, value);
	};

	this.__addRendered = function(self, name, node) {
		var rendered = self.__rendered;
		if (!rendered[name]) rendered[name] = [];
		rendered[name].push(node);
	};

	this.__addNodeMap = function(self, name, id, comp) {
		var nodeMap = self.__nodeMap;
		if (!nodeMap[name]) nodeMap[name] = {};
		nodeMap[name][id] = comp;
	};

	this._init = function(self) {
	};

	/**
	 * 弹出验证错误信息
	 */
	this._invalid = function(self, msg) {
		if (!msg) msg = '输入错误';
		alert(msg);
	};

	/**
	 * 弹出出错信息
	 */
	this._error = function(self, msg) {
		if (!msg) msg = '出错啦！';
		alert(msg);
	};

	/**
	 * 重置一个component，回到初始状态，删除所有render的元素。
	 */
	this._destory = function(self, methodName) {
		if (!methodName) methodName = 'destory'; // 兼容revert, reset方法名

		// 清空所有render进来的新元素
		self.__subs.forEach(function(name) {
			var sub = self.__properties__[name];
			var pname = '_' + name;
			if (self.__rendered[name]) {
				self.__rendered[name].forEach(function(node) {
					var comp = self.__nodeMap[name][node.uid];
					delete self.__nodeMap[name][node.uid];
					node.dispose();
					if (sub.single) {
						self[name] = self[pname] = null;
					} else {
						self[name].splice(self[name].indexOf(comp), 1); // 去掉
						self[pname].splice(self[pname].indexOf(node), 1); // 去掉
					}
				});
			}
			if (!sub.single) {
				self[name].forEach(function(comp) {
					comp[methodName]();
				});
			} else if (self[name]) {
				self[name][methodName]();
			}
		});
	};

	/**
	 * @deprecated
	 * 用destory代替
	 */
	this._revert = function(self) {
		self._destory('revert');
	};

	/**
	 * @deprecated
	 * 用destory代替
	 * 由于form有reset方法，在reset调用时，会fire reset事件，导致意外的表单重置
	 */
	this._reset = function(self) {
		self._destory('reset');
	};

	/**
	 * 获取option的值
	 * @param name name
	 */
	this.getOption = function(self, name) {
		var pname = '_' + name;
		if (self[pname] === undefined) {
			self[pname] = self.__properties__[name].defaultValue;
		}
		return self[pname];
	};

	/**
	 * 设置option的值
	 * @method
	 * @param name name
	 * @param value value
	 */
	this.setOption = options.overloadsetter(function(self, name, value) {

		function setToComponent(comp) {
			comp.__setOption(name, value);
			comp.fireEvent('__option_change_' + name, {value: value});
		}

		// 由于overloadsetter是通过name是否为string来判断传递形式是name-value还是{name:value}的
		// 在回调中为了性能需要直接传的parts，类型为数组，而不是字符串，因此无法通过回调用overloadsetter包装后的方法进行回调
		(function(self, name, value) {
			var parts = Array.isArray(name)? name : name.split('.');
			var ref = self[parts[0]]; // 如果是已经创建好的组件，除了存储到_options，还要更新组件的option
			if (parts.length > 1) {
				exports.setOptionTo(self._options, parts, value);
				if (ref) {
					arguments.callee(ref, parts.slice(1), value);
				}
			} else {
				if (self.constructor == exports.Components) {
					self.forEach(setToComponent);
				} else {
					setToComponent(self);
				}
			}
		})(self, name, value);
	});

	/**
	 * 渲染一组subcomponent
	 * @param name subcomponent名字
	 * @param data 模板数据/初始化参数
	 */
	this.render = function(self, name, data) {

		var sub = self.__properties__[name];
		var methodName = 'render' + string.capitalize(name);
		var method2Name = name + 'Render';
		var nodes;

		// 如果已经存在结构了，则不用再render了
		if (!!(sub.single? self[name] && self[name]._node.parentNode : self[name] && self[name][0] && self[name][0]._node.parentNode && self[name][0]._node.parentNode.nodeType != 11)) {
			return;
		}

		if (self[method2Name]) {
			nodes = self[method2Name](function() {
				return self.make(name, data);
			});
		} else if (self[methodName]) {
			nodes = self[methodName](data);
		} else {
			nodes = self.__querySub(name);
		}

		// 如果有返回结果，说明没有使用self.make，而是自己生成了需要的普通node元素，则对返回结果进行一次包装
		if (nodes) {
			if (sub.single) {
				if (Array.isArray(nodes) || nodes.constructor === dom.Elements) throw '这是一个唯一引用元素，请不要返回一个数组';
				self.__addRendered(name, nodes);
			} else {
				if (!Array.isArray(nodes) && nodes.constructor !== dom.Elements) throw '这是一个多引用元素，请返回一个数组';
				nodes = new dom.Elements(nodes);
				nodes.forEach(function(node) {
					self.__addRendered(name, node);
				});
			}

			self.__initSub(name, nodes);
		}
	};

	this.dispose = function(self) {
		self._node.dispose();
	};

	/**
	 * 根据subs的type创建一个component，并加入到引用中，这一般是在renderXXX方法中进行调用
	 * @param name
	 * @param data 模板数据
	 */
	this.make = function(self, name, data) {
		var sub = self.__properties__[name];
		var pname = '_' + name;
		var options = {};
		var extendOptions = self._options[name];
		object.extend(options, extendOptions);

		if (data) {
			Object.keys(data).forEach(function(key) {
				options[key] = data[key];
			});
		}

		var comp = new sub.type({
			template: options.template || sub.template,
			section: options.templateSection || sub.section
		}, options);
		var node = comp._node;

		if (sub.single) {
			self[name] = comp;
			self[pname] = node;
		} else {
			self[name].push(comp);
			self[pname].push(node);
		}
		self.__fillSub(name, comp);
		self.__addRendered(name, node);

		return comp;
	};

	/**
	 * 设置subcomponent的template
	 */
	this.setTemplate = function(self, name, template, section) {
		self.setOption(name + '.template', template);
		self.setOption(name + '.templateSection', section);
	};

	/**
	 * 获取包装的节点
	 */
	this.getNode = function(self) {
		return self._node;
	};

	this.define = staticmethod(exports.define);
	this.define1 = staticmethod(exports.define1);

});

this.addon = function(dict, Addon) {
	if (!dict.addons) {
		dict.addons = [];
	}
	dict.addons.push(Addon);
};

/**
 * {'a.b.c': 1, b: 2} ==> {a: {b: {c:1}}, b: 2}
 */
this.parseOptions = function(options) {
	var parsed = {};
	Object.keys(options).forEach(function(name) {
		exports.setOptionTo(parsed, name, options[name]);
	});
	return parsed;
};

this.setOptionTo = function(current, name, value) {
	var parts = Array.isArray(name)? name : name.split('.');
	// 生成前缀对象
	for (var i = 0, part; i < parts.length - 1; i++) {
		part = parts[i];
		if (current[part] === undefined) {
			current[part] = {};
		}
		current = current[part];
	}
	current[parts[parts.length - 1]] = value;
};

});
object.define('ui/decorators.js', 'events', function(require, exports) {

var events = require('events');

/**
 * @deprecated
 * use events.fireevent instead
 */
this.fireevent = events.fireevent;

});
;object.define('ui2/index.js', 'string, dom, events, ./aspect, ./net, ./options, ./components, ./metas/component, ./metas/option, ./metas/request, ./metas/eventmethod, ./metas/onmethod, ./metas/submethod, ./metas/subsubmethod, ./page, ./addon', function(require, exports, module) {
var string = require('string');
var dom = require('dom');
var events = require('events');
var aspect = require('./aspect');
var net = require('./net');
var optionsmod = require('./options');
var componentsmod = require('./components');

var metas = {
	component: require('./metas/component'),
	option: require('./metas/option'),
	request: require('./metas/request'),
	eventmethod: require('./metas/eventmethod'),
	onmethod: require('./metas/onmethod'),
	submethod: require('./metas/submethod'),
	subsubmethod: require('./metas/subsubmethod')
};

var decorators = [metas.eventmethod.eventmethod, metas.onmethod.onmethod, metas.submethod.submethod, metas.subsubmethod.subsubmethod];

this.define1 = metas.component.define1;
this.define = metas.component.define;
this.parent = metas.component.parent;
this.option = metas.option.option;
this.request = metas.request.request;

var globalid = 0;

function extend(src, target, ov) {
	for (var name in target) {
		if (src[name] === undefined || ov !== false) {
			src[name] = target[name];
		}
	}
	return src;
}

/**
 * 获取node节点已经被type包装过的实例
 */
this.getComponent = function(node, type) {
	var comp ;
	;(node.components || []).some(function(component) {
		// 用instanceOf判断，而不要通过gid
		// 在多个use下gid有可能重复，可能会找到错误的对象
		if (Class.instanceOf(component, type)) {
			comp = component;
			return true;
		}
	});
	return comp;
};

/**
 * 用于存放每个Component的信息
 */
function RuntimeMeta(cls) {
	// 此meta所在的component
	this.cls = cls;
	// 所有元素引用
	this.components = [];
	// 所有选项
	this.options = [];
	// 所有onXxx形式注册事件方法
	this.onMethods = [];
	// 所有xxx_xxx形式方法
	this.subMethods = [];
	// 所有xxx_xxx_xxx形式方法
	this.subSubMethods = [];
}

RuntimeMeta.prototype.addComponent = function(name) {
	if (this.components.indexOf(name) == -1) {
		this.components.push(name);
		return true;
	}
	return false;
};

RuntimeMeta.prototype.addOption = function(name) {
	if (this.options.indexOf(name) == -1) {
		this.options.push(name);
		return true;
	}
	return false;
};

/**
 * Component的metaclass
 */
this.ComponentClass = new Class(Type, function() {

	this.initialize = function(cls, name, base, dict) {
		var gid = globalid++;
		var memberSetter = cls.get('setMember');
		var meta = new RuntimeMeta(cls);
		var defaultOptions = {};

		cls.set('gid', gid);
		cls.set('meta', meta);
		cls.set('addons', []);
		cls.set('defaultOptions', defaultOptions);

		// 处理定义的成员
		Object.keys(dict).forEach(function(name) {
			var member = dict[name];
			var memberMeta = member? member.meta : null;
			if (name.slice(0, 2) == '__') {
				return;
			}

			memberSetter(name, member);
		});

		// 合并base的meta
		if (base != Object) {
			cls.get('mixBase')(base);
		}

		// 合并mixin的meta
		var mixer = cls.get('mixAddon');
		;(cls.__mixins__ || []).forEach(function(mixin) {
			// mixin的有可能不是addon
			if (!mixin.get('gid')) {
				return;
			}
			// 自己的addon
			if (cls.addAddon(mixin)) {
				// mixer 中 mix addon 的 addon
				mixer(mixin);
			}
		});

		// 生成Components
		cls.get('makeComponents')(name, base, dict);
	};

	this.__setattr__ = function(cls, name, member) {
		Type.__setattr__(cls, name, member);
		cls.get('setMember')(name, member);
	};

	/**
	 * 处理每一个component的成员
	 */
	this.setMember = function(cls, name, member) {
		var meta = cls.get('meta');
		var gid = cls.get('gid');
		var defaultOptions = cls.get('defaultOptions');
		var memberMeta;

		if (!member) {
			return;

		}
		else if (member.meta) {
			memberMeta = member.meta;
			memberMeta.addTo(cls, name, member);

			// 生成defaultOptions
			// 从meta中获取defaultOptions属性并合并到此组件的defaultOptions中
			if (memberMeta && memberMeta.defaultOptions) {
				Object.keys(memberMeta.defaultOptions).forEach(function(key) {
					defaultOptions[name + '.' + key] = memberMeta.defaultOptions[key];
				});
			}

		}
		else {
			decorators.forEach(function(decorator) {
				var newMember = decorator(name)(member);
				if (newMember) {
					newMember.meta.addTo(cls, name, member);
				}
			});
		}
	};

	/**
	 * 将base中的meta信息合并到cls
	 */
	this.mixBase = function(cls, base) {
		var meta = cls.get('meta');
		var oMeta = base.get('meta');

		// 合并addon
		base.get('addons').forEach(cls.addAddon, cls);

		// 合并defaultOptions
		extend(cls.get('defaultOptions'), base.get('defaultOptions'), false);

		// 合并components
		oMeta.components.forEach(meta.addComponent, meta);

		// 合并options
		oMeta.options.forEach(meta.addOption, meta);

		// 合并onmethod
		oMeta.onMethods.forEach(function(onEventMeta) {
			onEventMeta.addTo(cls);
		});

		// 合并submethod
		oMeta.subMethods.forEach(function(subMethodMeta) {
			subMethodMeta.addTo(cls);
		});

		// 合并subsubmethod
		oMeta.subSubMethods.forEach(function(subSubMethodMeta) {
			subSubMethodMeta.addTo(cls);
		});
	};

	this.mixAddon = function(cls, addon) {
		var meta = cls.get('meta');
		var oMeta = addon.get('meta');

		// 合并addon的addon
		addon.get('addons').forEach(cls.addAddon, cls);

		// 合并addon的defaultOptions
		extend(cls.get('defaultOptions'), addon.get('defaultOptions'), false);

		// 合并addon的components
		oMeta.components.forEach(meta.addComponent, meta);

		// 合并addon的options
		oMeta.options.forEach(meta.addOption, meta);

		// 合并addond哦onMethods
		oMeta.onMethods.forEach(function(onEventMeta) {
			onEventMeta.addAddonTo(addon, meta);
		});

		// 合并addon的submethod
		oMeta.subMethods.forEach(function(subMethodMeta) {
			subMethodMeta.addAddonTo(addon, meta);
		});

		// 合并addon的subsubmethod
		oMeta.subSubMethods.forEach(function(subSubMethodMeta) {
			subSubMethodMeta.addAddonTo(addon, meta);
		});

	};

	/**
	 * 生成Components
	 */
	this.makeComponents = function(cls, name, base, dict) {
		// Component则是Array，其他则是父类上的Components
		var compsBase = base.Components || Array;

		cls.set('Components', new componentsmod.ComponentsClass(compsBase, function() {

			this.initialize = function(self, nodes, options) {
				// an empty Components
				if (!nodes) {
					return;
				}
				self._node = nodes;
				self._node.forEach(function(node) {
					var comp = exports.getComponent(node, cls) || new cls(node, options);
					self.push(comp);
				});
			};

			Object.keys(dict).forEach(function(name) {
				var member = dict[name];
				if (name == '__metaclass__' || name == 'initialize') {
					return;
				}
				// only method, filter field and class
				if (typeof member != 'function' || Class.instanceOf(member, Type)) {
					return;
				}

				this[name] = member;
			}, this);
		}));

	};

});

/**
 * UI模块基类，所有UI组件的基本类
 */
this.Component = new exports.ComponentClass(function() {

	this.__mixins__ = [optionsmod.Options];

	/**
	 * @param {HTMLElement} node 包装的节点
	 * @param {Object} options 配置
	 */
	this.initialize = function(self, node, options) {
		// 可能是mixin addon
		if (!node) {
			return;
		}

		// 存储make的新元素
		self.__rendered = []; // 后来被加入的，而不是首次通过selector选择的node的引用
		// 存储所有注册的事件
		self.__events = [];
		// 记录本comp上的subMethods已经被注册到了哪些sub comp上
		self.__bounds = [];
		// 记录所有aop
		self.__signals = [];
		// 存储subMethods，用于render时获取信息
		self.__subMethodsMap = {};
		// 存储subSubMethods，用于render时获取信息
		self.__subSubMethodsMap = {};

		self._node = dom.wrap(node);

		if (!self._node.components) {
			self._node.components = [];
		}

		// 做同继承链的检测
		var lastType = self._node.componentType;
		if (!lastType) {
			self._node.componentType = self.__class__;
		} else if (Class.getChain(lastType).indexOf(self.__class__) != -1) {
		} else if (Class.getChain(self.__class__).indexOf(lastType) != -1) {
			self._node.componentType = self.__class__;
		} else {
			if (typeof console != 'undefined') {
				console.warn('node has already wrapped, auto changed to virtual mode.');
			}
			// 在virtual模式下，所有涉及到self._node触发事件的特性都不会有
			// 包括：
			// option（会触发change事件）
			// handle（会触发同名事件），但handle在此阶段已经无法控制了，只能要求开发者限制其使用
			// onEvent（会为自己绑定事件）
			self.__virtual = dom.wrap(document.createElement('div'));
		}
		self._node.components.push(self);

		// 限定wrapper
		if (self.allowTags && !self.allowTags.some(function(tag) {
			// get('tagName') 返回的永远大写
			return tag.toUpperCase() == self._node.get('tagName');
		})) {
			if (typeof console != 'undefined') {
				console.error('just allow ' + self.allowTags + ' tags.');
			}
			return;
		}

		// 记录已经获取完毕的components
		var inited = 0;
		function checkInit() {
			if (inited == self.meta.components.length) {
				inited = -1; // reset
				// 初始化addons
				self.addons.forEach(function(addon) {
					addon.get('_init')(self);
				}); 
				self.init();
			}
		}

		// 初始化subMethodsMap
		self.meta.subMethods.forEach(function(meta) {
			meta.init(self, name);
			// 初始化自己身上的aop方法
			var sub = meta.sub1;
			var type = meta.sub2;
			var member = self[sub];
			if (typeof member == 'function') {
				self.addAspectTo(self, sub, type, meta.fullname);
			}
		});

		// 初始化subSubMethodsMap
		self.meta.subSubMethods.forEach(function(meta) {
			meta.init(self, name);
		});

		if (!self.__virtual) {
			// 初始化options事件
			self.meta.options.forEach(function(name) {
				self.getMeta(name).bindEvents(self, name);
			});

			// 初始化onMethods
			self.meta.onMethods.forEach(function(meta) {
				meta.bindEvents(self);
			});
		}

		// 初始化options
		self._options = {};
		options = options || {};
		extend(options, self.defaultOptions, false);
		// 生成option在组件上的初始引用
		self.meta.options.forEach(function(name) {
			self.getOption(name);
		});
		// 设置所有传进来的option
		self.setOption(options);

		// 初始化components
		self.meta.components.forEach(function(name) {
			self.getMeta(name).select(self, name, null, function(comp) {
				inited++;
				checkInit();
			});
		});

		checkInit();
	};

	this.addAddon = classmethod(function(cls, addon) {
		var addons = cls.get('addons');
		if (addons.indexOf(addon) == -1) {
			addons.push(addon);
			return true;
		}
		return false;
	});

	/**
	 * 统一的aop注册入口
	 */
	this.addAspectTo = function(self, comp, originName, aspectType, methodName) {
		var advice = (aspectType == 'around') ? function(origin) {
			// 返回一个绑定后的origin
			return self[methodName](function() {
				return origin.apply(comp, arguments);
			});
		} : self[methodName];
		var signal = aspect[aspectType](comp, originName, advice, true);
		signal.comp = comp;
		// 记录自己给别人添加的aop方法
		self.__signals.push(signal);
	};

	/**
	 * 统一的注册事件入口，当一个组件需要给自己或其子成员注册事件时使用
	 * 统一入口可统一记录所有事件注册，在destroy时统一清除
	 */
	this.addEventTo = function(self, comp, type, func, cap) {
		comp.addEvent(type, func, cap);
		var item = {
			comp: comp,
			type: type,
			func: func,
			cap: cap
		};
		// 记录自己给别人添加的事件
		self.__events.push(item);
	};

	this.fireEvent = function(self) {
		return (self.__virtual || self._node).fireEvent.apply(self._node, Array.prototype.slice.call(arguments, 1));
	};

	this.addEvent = function(self) {
		return (self.__virtual || self._node).addEvent.apply(self._node, Array.prototype.slice.call(arguments, 1));
	};

	this.removeEvent = function(self) {
		return (self.__virtual || self._node).removeEvent.apply(self._node, Array.prototype.slice.call(arguments, 1));
	};

	this.show = function(self) {
		return self._node.show();
	};

	this.hide = function(self) {
		return self._node.hide();
	};

	/**
	 * 根据模板和选项生成一个节点
	 */
	this.createNode = function(self, template, data) {
		if (!template) {
			console.error('no template specified for ' + name + '.');
			return null;
		}
		var extendData = {};
		self.meta.options.forEach(function(name) {
			extendData[name] = self.get(name);
		});
		extend(data, extendData);
		var result = string.substitute(template, data);
		var node = dom.Element.fromString(result);

		return node;
	};

	this._init = function(self) {
	};

	/**
	 * 弹出验证错误信息
	 */
	this._invalid = function(self, msg) {
		if (!msg) msg = '输入错误';
		alert(msg);
	};

	/**
	 * 弹出出错信息
	 */
	this._error = function(self, msg) {
		if (!msg) msg = '出错啦！';
		alert(msg);
	};

	/**
	 * 重置组件
	 * 所有渲染出来的节点会被删除
	 * 所有注册的事件会被移除
	 */
	this._destroy = function(self) {

		// 删除所有render的元素
		self.__rendered.forEach(function(node) {
			node.dispose();
		});
		self.__rendered.splice(self.__rendered.length);

		// 清除所有注册的事件
		self.__events.forEach(function(item) {
			item.comp.removeEvent(item.type, item.func, item.cap);
		});
		self.__events.splice(self.__events.length);

		// 清除所有aop包装
		self.__signals.forEach(function(signal) {
			signal.remove();
		});
		self.__signals.splice(self.__signals.length);

		// 将node上保存的自己的引用删掉
		// 恢复self包装过node的所有痕迹
		self._node.components.splice(self._node.components.indexOf(self), 1);
	};

	this.destroyComponent = function(self, comp) {
		// 清除self注册给comp的事件
		self.__events.forEach(function(item) {
			if (item.comp === comp) {
				item.comp.removeEvent(item.type, item.func, item.cap);
			}
		});

		// 清除self注册给comp的aop方法
		self.__signals.forEach(function(signal) {
			if (signal.comp === comp) {
				signal.remove();
			}
		});

		// destroy后，所有的self注册给其的事件已经清除，将其从__bounds中删除
		self.__bounds.splice(self.__bounds.indexOf(comp), 1);
	};

	/**
	 * 清空自身节点
	 */
	this._dispose = function(self) {
		// virtual mode 无法触发事件，因此不执行dispose操作
		if (!self.__virtual) {
			self._node.dispose();
			self.fireEvent('afterdispose');
			self.destroy();
		}
	};

	/**
	 * 获取一个通过ui.request定义的net.Request的实例
	 */
	this.getRequest = function(self, name, data) {
		var pname = '_' + name;
		var options = self.getOption(name) || {};
		if (data) {
			options = object.clone(options);
			options.url = string.substitute(options.url, data);
		}
		var request;
		if (!self[pname]) {
			request = new net.Request();
			self.getMeta(name).bindEvents(self, name, request);
			self[pname] = request;
		} else {
			request = self[pname];
		}
		request.setOption(options);
		self._set(name, request);
		return request;
	};

	/**
	 * 设置获取到的component
	 */
	this.setComponent = function(self, name, comp) {
		var node = comp? comp._node : null;
		self._set(name, comp);
		self._set('_' + name, node);
	};

	/**
	 * 获取成员的meta信息
	 */
	this.getMeta = classmethod(function(cls, name) {
		var meta;
		var member = cls.get(name, false);

		if (!member) {
			return null;
		}

		if (member.__class__ == property) {
			meta = member.meta;
		}
		else if (typeof member == 'function') {
			meta = member.im_func.meta;
		}
		else {
			meta = null;
		}

		return meta;
	});

	/**
	 * 渲染一组component，渲染后执行callback
	 * @param {String} name 子component名字
	 * @param {Object} data 模板数据/初始化参数
	 * @param {Function} callback render结束后的回调
	 */
	this.render = function(self, name, data, callback) {
		// data可选
		if (!callback && typeof data == 'function') {
			callback = data;
			data = null;
		}

		var meta = self.getMeta(name);
		return meta.render(self, name, data, callback);
	};

	/**
	 * 获取包装的节点
	 */
	this.getNode = function(self) {
		return self._node;
	};

});

this.Page = require('./page').Page;
this.AddonClass = require('./addon').AddonClass;

});
;object.define('ui2/components.js', function(require, exports, module) {
this.ComponentsClass = new Class(Type, function() {

	this.initialize = function(cls, name, base, dict) {

		Object.keys(dict).forEach(function(name) {
			var member = dict[name];
			// 暂时忽略setOption
			if (name == 'initialize' || name == 'setOption') return;
			cls.set(name, member);
		});
	};

	this.__setattr__ = function(cls, name, member) {
		cls.get('setMember')(name, member);
	};

	/*
	 * 制造包装后的方法，遍历调用所有子节点的同名方法
	 */
	this.makeMethod = function(cls, name) {
		// 重新包装，避免名字不同导致warning
		Type.__setattr__(cls, name, function(self) {
			var results = [];
			var args = Array.prototype.slice.call(arguments, 1);
			// 有可能是个空的Components
			if (self._node) {
				self._node.forEach(function(node, i) {
					// 将每个的执行结果返回组成数组
					var result = self[i][name].apply(self[i], args);
					results.push(result);
				});
			}
			return results;
		});
	};

	this.setMember = function(cls, name, member) {
		var newName;
		var makeMethod = cls.get('makeMethod');

		if (name == 'getNode') {
			Type.__setattr__(cls, name, member);
		}
		else if (name.slice(0, 1) == '_' && name.slice(0, 2) != '__' && name != '_set') {
			// xxx
			makeMethod(name.slice(1));
			// _xxx
			makeMethod(name);
		}
		else {
			makeMethod(name);
		}
	};

});

});
;object.define('ui2/addon.js', 'ui2, string', function(require, exports, module) {
var ui = require('ui2');
var string = require('string');

this.AddonClassClass = new Class(Type, function() {

	this.__new__ = function(cls, name, base, dict) {

		var members = (base.get('__members') || []).slice();
		var variables = (base.get('__variables') || []).slice();

		Object.keys(dict).forEach(function(name) {
			if (name.indexOf('__') == 0 || name == 'initialize') {
				return;
			}
			else if (name.indexOf('$') == 0) {
				variables.push(name);
			}
			else {
				members.push(name);
			}
		});
		// 如果不带下划线，就有可能覆盖掉自定义的方法，也就意味着开发者不能定义这些名字的成员
		dict.__variables = variables;
		dict.__members = members;

		return Type.__new__(cls, name, base, dict);
	};
});

// 继承于 ComponentClass
this.AddonClass = new exports.AddonClassClass(ui.ComponentClass, function() {

	this.__new__ = function(cls, name, base, dict) {

		// base是Component
		if (base !== ui.Component) {
			base = ui.Component;
		}

		var members = cls.get('__members');
		var variables = cls.get('__variables');

		// 生成vars
		var vars = {};
		variables.forEach(function(name) {
			vars[name.slice(1)] = cls.get(name);
		});
		// 变量递归，支持变量中引用变量
		variables.forEach(function(name) {
			var member = cls.get(name);
			if (typeof member == 'string') {
				vars[name.slice(1)] = string.substitute(member, vars);
			}
		});

		// 生成member
		members.forEach(function(nameTpl) {
			var name = string.substitute(nameTpl, vars);
			var member = cls.get(nameTpl);
			if (typeof member == 'function') {
				member = member(cls, vars);
			}
			dict[name] = member;
		});

		return Type.__new__(cls, name, base, dict);
	};

});

});
;object.define('ui2/page.js', 'ui2, window', function(require, exports, module) {
var ui = require('ui2');

/**
 * 一组Component的在页面上的集合，用于初始化页面
 */
this.Page = new Class(ui.Component, function() {

	/**
	 * @param {HTMLElement} [node=document.body] 页面的起始查询节点
	 * @param {Object} options 配置页面组件的选项
	 */
	this.initialize = function(self, node, options) {

		var window = require('window');

		// node 参数可选
		if (node.ownerDocument !== window.document) {
			options = node;
			node = window.document.body;
		}

		if (!options) {
			options = {};
		}

		// 会自动进入virtual mode
		this.parent(self, node, options);
	};

});

});
;object.define('ui2/metas/component.js', 'dom, ui2, ../memberloader, ../memberloader, sys, urlparse', function(require, exports, module) {
var dom = require('dom');
var ui = require('ui2');

/**
 * 帮助定义一个生成组件间联系的方法
 */
function defineComponent(meta) {
	function fget(self) {
		var name = prop.__name__;
		// select只处理查询，不处理放置到self。
		// 这里不能直接meta.select，而是确保options中的meta信息存在，需要用getMeta
		var meta = self.getMeta(name);
		meta.select(self, name);
		return self[name];
	}
	var prop = property(fget);
	prop.meta = meta;
	return prop;
}

/**
 * 为一个Component定义一个components引用
 * 用法：
 * MyComponent = new Class(ui.Component, {
 *	refname: ui.define('.css-selector', ui.menu.Menu, {
 *		clickable: true
 *	}, renderer)
 * });
 * 这样MyComponent实例的refname属性即为相对应selector获取到的节点引用
 * @param {String|false} selector css选择器
 * @param {Component|String} [type=Component] 构造类的引用或模块成员字符串
 * @param {Object} [options] 默认配置
 * @param {Function} [renderer] 渲染器
 */
this.define = function(selector, type, options, renderer) {
	if (type && typeof type !== 'string' && !Class.instanceOf(type, Type)) {
		renderer = options;
		options = type;
		type = null;
	}
	if (options && typeof options != 'object') {
		renderer = options;
		options = null;
	}

	if (!type) type = ui.Component;
	return defineComponent(new ComponentsMeta(selector, type, options, renderer));
};

/**
 * 同define，不过是定义唯一引用的component
 * @param {String|false} selector css选择器
 * @param {Component|String} [type=Component] 构造类的引用或模块成员字符串
 * @param {Object} [options] 默认配置
 * @param {Function} [renderer] 渲染器
 */
this.define1 = function(selector, type, options, renderer) {
	if (type && typeof type !== 'string' && !Class.instanceOf(type, Type)) {
		renderer = options;
		options = type;
		type = null;
	}
	if (options && typeof options != 'object') {
		renderer = options;
		options = null;
	}

	if (!type) type = ui.Component;
	return defineComponent(new ComponentMeta(selector, type, options, renderer));
};

/**
 * 定义父元素的引用，将在Component构造时遍历父节点直到找到相同类型的Component
 * @param {Component} type
 */
this.parent = function(type, options) {
	if (!type) {
		throw new Error('arguments error.');
	}

	var meta = new ComponentMeta(null, type, options, null);
	meta.defaultOptions['meta.parent'] = true;

	return defineComponent(meta);
};

function ComponentMeta(selector, type, options, renderer) {
	this.type = type;
	this.renderer = renderer;
	this.defaultOptions = options || {};
	this.defaultOptions['meta.selector'] = selector;
}

ComponentMeta.prototype.getRenderer = function(metaOptions) {
	var selector = metaOptions.selector;
	var renderer = this.renderer;
	// selector为false的free组件拥有默认renderer，创建即返回
	if (!renderer && selector === false) {
		renderer = function(self, make) {
			return make();
		};
	}
	return renderer;
};

ComponentMeta.prototype.addTo = function(cls, name, member) {
	var meta = cls.get('meta');
	meta.addComponent(name);
};

/**
 * 获取组件类
 */
ComponentMeta.prototype.getType = function(metaOptions, callback) {

	if (!metaOptions) {
		metaOptions = {};
	}

	var meta = this;
	var type = metaOptions.type || this.type;
	var addons = metaOptions.addons;
	var cls;

	var memberloader = require('../memberloader');

	// async
	if (typeof type == 'string') {
		memberloader.load(type, function(cls) {
			meta.getAddonedType(cls, addons, callback);
		});
	}
	// class
	else if (Class.instanceOf(type, Type)) {
		cls = type;
		this.getAddonedType(cls, addons, callback);
	}
	// sync
	else if (typeof type == 'function') {
		cls = type();
		this.getAddonedType(cls, addons, callback);
	}
};

/**
 * 获取被addon过的组件类
 * @param cls 基类
 * @param addons addons字符串
 * @param calblack
 */
ComponentMeta.prototype.getAddonedType = function(cls, addons, callback) {
	if (!addons) {
		callback(cls);
		return;
	}

	var memberloader = require('../memberloader');

	memberloader.load(addons, function() {
		// 存储最终的被扩展过的组件
		var addoned;

		// 获取到的组件类
		addons = Array.prototype.slice.call(arguments, 0);

		// 根据addons的gid顺序拼成一个字符串，作为保存生成的组件的key
		var key = [];
		addons.forEach(function(addon) {
			key.push(addon.get('gid'));
		});
		key.sort();
		key = key.join();

		// 之前已经生成过
		addoned = cls.get('addoned$' + key);

		// 没有生成过
		if (!addoned) {
			// 把生成的类保存在原始类上，用addons的gid的集合作为key
			addoned = new Class(cls, {__mixins__: addons});
			cls.set('addoned$' + key, addoned);
		}
		callback(addoned);
	});
};

/**
 * 将生成或查询到的node用type进行包装
 */
ComponentMeta.prototype.wrap = function(self, name, node, type) {
	var comp = ui.getComponent(node, type);

	// 此node已经被type类型包装过
	if (comp) {
		this.register(self, name, comp);
	}
	// 一个未被type包装过的node
	else {
		comp = new type(node, self._options[name]);
		this.bindEvents(self, name, comp);
		self.addEventTo(comp, 'afterdispose', function() {
			// 重新获取其引用
			self.getMeta(name).select(self, name);
		});
		self.addEventTo(comp, 'destroy', function() {
			self.destroyComponent(comp);
		});
	}

	return comp;
};

/**
 * 将查询到的comp用type进行包装
 */
ComponentMeta.prototype.register = function(self, name, comp) {
	this.bindEvents(self, name, comp);
	// 重新搜索，更新其options
	comp.setOption(self._options[name]);
};

/**
 * 将生成的comp设置到self上，并执行callback
 */
ComponentMeta.prototype.setComponent = function(self, name, comp, callback) {
	self.setComponent(name, comp);
	if (callback) {
		callback(comp);
	}
};

ComponentMeta.prototype.render = function(self, name, data, callback) {
	var meta = this;
	var metaOptions = self.getOption(name + '.meta');
	this.getType(metaOptions, function(type) {

		// 如果已经存在结构了，则不用再render了
		// 需要确保这个get是同步的，因此在getType后执行
		var comp = self.get(name);
		if (comp && (!('length' in comp) || comp.length != 0)) {
			if (callback) {
				callback();
			}
			return;
		}

		var renderer = meta.getRenderer(metaOptions);
		if (!renderer) {
			console.error('no renderer specified for ' + name + '.');
			return;
		}

		// data
		data = data || {};
		var options = self._options[name];
		object.extend(data, options, false);

		meta.getTemplate(metaOptions, self.__class__.__module__, function(template) {
			var made = [];
			// make方法仅仅返回node，这样在new comp时node已经在正确的位置，parent可以被正确的查找到
			function make(newData) {
				var node = self.createNode(template, newData || data);
				made.push(node);
				self.__rendered.push(node);
				return node;
			};

			// for debug
			make.template = template;
			make.data = data;

			// made用在free component的定义
			var returnMade = renderer(self, make, data);
			if (returnMade) {
				made = returnMade;
			}

			meta.select(self, name, made);

			if (callback) {
				callback();
			}

		});
	});
};

/**
 * 根据selector查询节点并进行包装，通过callback返回
 * @param self
 * @param name
 * @param made 如果selector为false，则需要指定节点是什么
 * @param callback
 */
ComponentMeta.prototype.select = function(self, name, made, callback) {

	var meta = this;
	var node;
	var metaOptions = self.getOption(name + '.meta') || {};
	var selector = metaOptions.selector;
	var isParent = metaOptions.parent;
	var isAsync = metaOptions.async;

	// async
	if (self[name] === undefined && isAsync) {
		meta.setComponent(self, name, null, callback);
		return;
	}

	if (isParent) {
		this.getType(metaOptions, function(type) {
			var node = self._node;
			var comp = null;
			while ((node = node.parentNode)) {
				if ((comp = ui.getComponent(node, type))) {
					break;
				}
			}

			if (comp) {
				meta.register(self, name, comp);
			}
			meta.setComponent(self, name, comp, callback);
		});

	} else {
		// 说明无所谓selector，生成什么就放什么就行
		// 在强指定selector为false时，忽略meta中配置的selector
		if (selector === false) {
			// 不应该是一组成员，却是数组
			if (Array.isArray(made)) {
				node = made[0];
			} else {
				node = made;
			}
		}
		// 重建引用，若render正常，刚刚创建的节点会被找到并包装
		else {
			if (typeof selector == 'function') {
				node = dom.wrap(selector(self));
			} else {
				node = self._node.getElement(selector);
			}

		}

		if (node) {
			this.getType(metaOptions, function(type) {
				var comp = meta.wrap(self, name, node, type);
				meta.setComponent(self, name, comp, callback);
			});

		} else {
			meta.setComponent(self, name, null, callback);
		}
	}

};

/**
 * @param relativeModule 类所在的模块名，用来生成相对路径
 */
ComponentMeta.prototype.getTemplate = function(metaOptions, relativeModule, callback) {
	if (!metaOptions) {
		metaOptions = {};
	}

	var sys = require('sys');
	var urlparse = require('urlparse');
	var templatemodule = metaOptions.templatemodule;
	var template = metaOptions.template;

	var base;
	// 是相对路径 && 能找到此类的所在模块信息 && 在sys.modules中有这个模块
	if (templatemodule && (templatemodule.indexOf('./') === 0 || templatemodule.indexOf('../') === 0) && relativeModule && sys.modules[relativeModule]) {
		base = sys.getModule(relativeModule).id;
		templatemodule = urlparse.urljoin(base, templatemodule);
	}
	if (templatemodule) {
		require.async(templatemodule, function(module) {
			callback(module);
		});
	} else {
		callback(template);
	}

};

ComponentMeta.prototype.bindEvents = function(self, name, comp) {

	if (!comp) {
		return;
	}

	// comp可能会注册来自多个引用了它的其他的comp的事件注册
	// 通过在__bounds中保存已经注册过的其他组件，避免重复注册
	if (self.__bounds.indexOf(comp) != -1) {
		return;
	} else {
		self.__bounds.push(comp);
	}

	;(self.__subSubMethodsMap[name] || []).forEach(function(aspectMeta) {
		var fullname = aspectMeta.fullname;
		var originName = aspectMeta.sub2;
		var aspectType = aspectMeta.sub3;
		if (comp[originName]) {
			self.addAspectTo(comp, originName, aspectType, fullname);
		}
	});

	;(self.__subMethodsMap[name] || []).forEach(function(meta) {
		var fullname = meta.fullname;
		var type = meta.sub2;
		self.addEventTo(comp, type, function(event) {
			event.targetComponent = comp;
			var args;
			// 将event._args pass 到函数后面
			if (event._args) {
				args = [event].concat(event._args);
				self[fullname].apply(self, args);
			} else {
				self[fullname](event);
			}
		});
	});

};

function ComponentsMeta(selector, type, options, renderer) {
	ComponentMeta.apply(this, arguments);
}

ComponentsMeta.prototype = new ComponentMeta();

ComponentsMeta.prototype.select = function(self, name, made, callback) {

	var metaOptions = self.getOption(name + '.meta') || {};
	var selector = metaOptions.selector;
	var nodes = null, comps = null;
	var meta = this;

	// 说明无所谓selector，生成什么就放什么就行
	// 在强指定selector为false时，忽略options中配置的selector
	if (selector === false) {
		// 应该是一组成员，确是不是数组
		if (made && !Array.isArray(made)) {
			nodes = [made];
		} else {
			nodes = made;
		}
	}
	// 重建引用，若render正常，刚刚创建的节点会被找到并包装
	else {
		if (typeof selector == 'function') {
			nodes = selector(self);
			// 确保返回的是个dom.Elements
			if (nodes.constructor != dom.Elements) {
				if (!nodes.length) {
					nodes = [nodes];
				}
				nodes = new dom.Elements(nodes);
			}
		} else {
			nodes = self._node.getElements(selector);
		}
	}

	if (nodes) {
		// 返回的是数组，变成Elements
		// 避免重复包装
		// TODO 用addEvent避免重复包装的方法不优雅
		if (!nodes.addEvent) {
			nodes = new dom.Elements(nodes);
		}

		this.getType(metaOptions, function(type) {
			nodes.forEach(function(node) {
				meta.wrap(self, name, node, type);
			});
			comps = new type.Components(nodes);
			meta.setComponent(self, name, comps, callback);
		});

	} else {
		// 返回空Components而不是null
		comps = new ui.Component.Components();
		meta.setComponent(self, name, comps, callback);
	}

};

});
;object.define('ui2/metas/option.js', function(require, exports, module) {
/**
 * 声明一个option
 * 用法：
 * MyComponent = new Class(ui.Component, {
 *	myConfig: ui.option(1)
 * });
 * 这样MyComponent实例的myConfig属性值即为默认值1，可通过 set 方法修改
 */
this.option = function(defaultValue, getter) {
	var meta = new OptionMeta(defaultValue, getter);
	function fget(self) {
		var name = prop.__name__;
		return self.getOption(name);
	}
	function fset(self, value) {
		var name = prop.__name__;
		return self.setOption(name, value);
	}
	var prop = property(fget, fset);
	prop.meta = meta;
	return prop;
};

function OptionMeta(defaultValue, getter) {
	this.defaultValue = defaultValue;
	this.getter = getter;
}

OptionMeta.prototype.addTo = function(cls, name, member) {
	var meta = cls.get('meta');
	meta.addOption(name);
};

/**
 * 将value转换成需要的type
 */
OptionMeta.prototype.ensureTypedValue = function(value) {
	var type = typeof this.defaultValue;

	if (type === 'number') return Number(value);
	else if (type === 'string') return String(value);
	else if (type === 'boolean') return Boolean(value);
};

OptionMeta.prototype.bindEvents = function(self, name) {
	if (!self.__subMethodsMap[name]) {
		return;
	}
	self.__subMethodsMap[name].forEach(function(meta) {
		var fullname = meta.fullname;
		var sub = meta.sub1;
		var type = meta.sub2;
		var fakeType = '__option_' + type + '_' + sub;
		self.addEventTo(self, fakeType, self.get(fullname));
	});
};

});
;object.define('ui2/metas/request.js', function(require, exports, module) {
/**
 * 声明一个request，可为其注册事件
 * @param url
 * @param [method='get']
 */
this.request = function(url, method) {
	var meta = new RequestMeta(url, method || 'get');
	var prop = property(function(self) {
		var name = prop.__name__;
		return self.getRequest(name);
	});
	prop.meta = meta;
	return prop;
};

function RequestMeta(url, method) {
	this.defaultOptions = {
		url: url,
		method: method
	};
}

RequestMeta.prototype.addTo = function() {
};

RequestMeta.prototype.bindEvents = function(self, name, comp) {

	if (!comp) {
		return;
	}

	// comp可能会注册来自多个引用了它的其他的comp的事件注册
	// 通过在__bounds中保存已经注册过的其他组件，避免重复注册
	if (self.__bounds.indexOf(comp) != -1) {
		return;
	} else {
		self.__bounds.push(comp);
	}

	;(self.__subMethodsMap[name] || []).forEach(function(meta) {
		var fullname = meta.fullname;
		var type = meta.sub2;
		self.addEventTo(comp, type, function(event) {
			event.targetComponent = comp;
			var args;
			// 将event._args pass 到函数后面
			if (event._args) {
				args = [event].concat(event._args);
				self[fullname].apply(self, args);
			} else {
				self[fullname](event);
			}
		});
	});

};

});
;object.define('ui2/metas/eventmethod.js', 'events', function(require, exports, module) {
var events = require('events');

this.eventmethod = function(name) {
	if (name.slice(0, 1) == '_' && name.slice(0, 2) != '__' && name != '_set') {
		return function(func) {
			func.meta = new EventMethodMeta();
			return func;
		};
	} else {
		return function() {
			return null;
		};
	}
};

function EventMethodMeta() {
}

EventMethodMeta.prototype.addTo = function(cls, name, member) {
	Type.__setattr__(cls, name.slice(1), events.fireevent(member));
};

});
;object.define('ui2/metas/onmethod.js', function(require, exports, module) {
/**
 * 定义一个扩展向宿主元素定义事件的方法
 * @decorator
 */
this.onmethod = function(name) {
	// 名子要匹配带有$后缀
	var match = name.match(/^on([a-zA-Z1-9]+)([\$0-9]*)$/);
	if (!match) {
		// 名字不匹配，返回的decorator返回空
		return function() {
			return null;
		};
	}
	var eventType = match[1];
	// 后面带的无用的东西，只是用来区分addon的
	var surfix = match[2];
	eventType = eventType.slice(0, 1).toLowerCase() + eventType.slice(1);
	return function(func) {
		func.meta = new OnMethodMeta(eventType, name);
		return func;
	};
};

function OnMethodMeta(eventType, fullname) {
	this.eventType = eventType;
	this.fullname = fullname;
}

OnMethodMeta.prototype.storeKey = 'onMethods';

OnMethodMeta.prototype.decorator = exports.onmethod;

OnMethodMeta.prototype.addTo = function(cls) {
	var meta = cls.get('meta');
	if (!meta[this.storeKey].some(this.equal, this)) {
		this.cls = meta.cls;
		meta[this.storeKey].push(this);
	}
};

OnMethodMeta.prototype.addAddonTo = function(addon, meta) {
	var func;
	var fullname;
	var newName;
	var newMember;
	var oGid = addon.get('gid');

	if (!meta[this.storeKey].some(this.strictEqual, this)) {
		fullname = this.fullname;
		newName = fullname + '$' + oGid;
		func = addon.get(fullname, false).im_func;
		// 重新包装，避免名字不同导致warning
		newMember = this.decorator(newName)(function() {
			return func.apply(meta, arguments);
		});
		Type.__setattr__(meta.cls, newName, newMember);
		newMember.meta.cls = this.cls;
		// 传递重新生成的这个meta
		meta[this.storeKey].push(newMember.meta);
	}
};

OnMethodMeta.prototype.strictEqual = function(other) {
	return this.equal(other) && this.cls === other.cls;
};

OnMethodMeta.prototype.equal = function(other) {
	return this.eventType == other.eventType;
};

OnMethodMeta.prototype.bindEvents = function(self) {
	var eventType = this.eventType;
	var methodName = this.fullname;

	self.addEventTo(self, eventType, function(event) {
		var args = [event];
		//将event._args pass 到函数后面
		if (event._args) {
			args = args.concat(event._args);
		}
		self[methodName].apply(self, args);
	});
};

});
;object.define('ui2/metas/submethod.js', function(require, exports, module) {
/**
 * 定义一个向子元素注册事件的方法
 * @decorator
 * @param name 一个函数名字
 */
this.submethod = function(name) {
	// 名子要匹配带有$后缀
	var match = name.match(/^([a-zA-Z1-9]+)_([a-zA-Z1-9]+)([\$0-9]*)$/);
	if (!match) {
		// 名字不匹配，返回的decorator返回空
		return function() {
			return null;
		};
	}
	var sub = match[1];
	var eventType = match[2];
	// 后面带的无用的东西，只是用来区分addon的
	var surfix = match[3];
	return function(func) {
		func.meta = new SubMethodMeta(sub, eventType, name);
		return func;
	};
};

function SubMethodMeta(sub1, sub2, fullname) {
	this.sub1 = sub1;
	this.sub2 = sub2;
	this.fullname = fullname;
}

SubMethodMeta.prototype.storeKey = 'subMethods';

SubMethodMeta.prototype.decorator = this.submethod;

SubMethodMeta.prototype.addTo = function(cls) {
	var meta = cls.get('meta');
	if (!meta[this.storeKey].some(this.equal, this)) {
		this.cls = meta.cls;
		meta[this.storeKey].push(this);
	}
};

SubMethodMeta.prototype.addAddonTo = function(addon, meta) {
	var func;
	var fullname;
	var newName;
	var newMember;
	var oGid = addon.get('gid');

	if (!meta[this.storeKey].some(this.strictEqual, this)) {
		fullname = this.fullname;
		newName = fullname + '$' + oGid;
		func = addon.get(fullname, false).im_func;
		// 重新包装，避免名字不同导致warning
		newMember = this.decorator(newName)(function() {
			return func.apply(meta, arguments);
		});
		Type.__setattr__(meta.cls, newName, newMember);
		newMember.meta.cls = this.cls;
		// 传递重新生成的这个meta
		meta[this.storeKey].push(newMember.meta);
	}
};

SubMethodMeta.prototype.strictEqual = function(other) {
	return this.equal(other) && this.cls === other.cls;
};

SubMethodMeta.prototype.equal = function(other) {
	return this.sub1 == other.sub1 && this.sub2 == other.sub2;
};

SubMethodMeta.prototype.init = function(self, name) {
	var sub1 = this.sub1;
	// 记录下来，render时从__subMethodsMap获取信息
	if (!self.__subMethodsMap[sub1]) {
		self.__subMethodsMap[sub1] = [];
	}
	self.__subMethodsMap[sub1].push(this);
};

});
;object.define('ui2/metas/subsubmethod.js', function(require, exports, module) {
this.subsubmethod = function(name) {
	// 名子要匹配带有$后缀
	var match = name.match(/^([a-zA-Z1-9]+)_([a-zA-Z1-9]+)_([a-zA-Z1-9]+)([\$0-9]*)$/);
	if (!match) {
		// 名字不匹配，返回的decorator返回空
		return function() {
			return null;
		};
	}
	var sub = match[1];
	var methodName = match[2];
	var aspectType = match[3];
	// 后面带的无用的东西，只是用来区分addon的
	var surfix = match[4];
	return function(func) {
		func.meta = new SubSubMethodMeta(sub, methodName, aspectType, name);
		return func;
	};
};

function SubSubMethodMeta(sub1, sub2, sub3, fullname) {
	this.sub1 = sub1;
	this.sub2 = sub2;
	this.sub3 = sub3;
	this.fullname = fullname;
}

SubSubMethodMeta.prototype.storeKey = 'subSubMethods';

SubSubMethodMeta.prototype.decorator = exports.subsubmethod;

SubSubMethodMeta.prototype.addTo = function(cls) {
	var meta = cls.get('meta');
	if (!meta[this.storeKey].some(this.equal, this)) {
		this.cls = meta.cls;
		meta[this.storeKey].push(this);
	}
};

SubSubMethodMeta.prototype.addAddonTo = function(addon, meta) {
	var func;
	var fullname;
	var newName;
	var newMember;
	var oGid = addon.get('gid');

	if (!meta[this.storeKey].some(this.strictEqual, this)) {
		fullname = this.fullname;
		newName = fullname + '$' + oGid;
		func = addon.get(fullname, false).im_func;
		// 重新包装，避免名字不同导致warning
		newMember = this.decorator(newName)(function() {
			return func.apply(meta, arguments);
		});
		Type.__setattr__(meta.cls, newName, newMember);
		newMember.meta.cls = this.cls;
		// 传递重新生成的这个meta
		meta[this.storeKey].push(newMember.meta);
	}
};

SubSubMethodMeta.prototype.equal = function(other) {
	return this.sub1 == other.sub1 && this.sub2 == other.sub2 && this.sub3 == other.sub3;
};

SubSubMethodMeta.prototype.strictEqual = function(other) {
	return this.equal(other) && this.cls === other.cls;
};

SubSubMethodMeta.prototype.init = function(self, name) {
	var sub1 = this.sub1;
	// 记录下来，render时从__subSubMethodsMap获取信息
	if (!self.__subSubMethodsMap[sub1]) {
		self.__subSubMethodsMap[sub1] = [];
	}
	self.__subSubMethodsMap[sub1].push(this);
};

});
;object.define('ui2/memberloader.js', function(require, exports, module) {
function load(items, callback) {
	if (!items) {
		callback();
		return;
	}
	items = items.trim();
	var dependencies = [];
	var memberNames = [];
	if (!Array.isArray(items)) {
		items = items.split(/\s*,\s*/g);
	}
	items.forEach(function(item) {
		dependencies.push(item.slice(0, item.lastIndexOf('.')).replace(/\./g, '/'));
		memberNames.push(item.slice(item.lastIndexOf('.') + 1));
	});
	require.async(dependencies, function() {
		var members = [];
		var member;
		for (var i = 0; i < arguments.length; i++) {
			member = arguments[i][memberNames[i]];
			if (member === undefined) {
				console.warn('can\'t find ' + memberNames[i] + ' in ' + dependencies[i]);
			}
			members.push(member);
		}
		callback.apply(null, members);
	});
}

this.load = load;

});
;object.define('ui2/net.js', 'net, ./optionsbase', function(require, exports, module) {
var net = require('net');
var optionsmod = require('./optionsbase');

exports.Request = new Class(net.Request, function() {
	this.setOption = optionsmod.overloadsetter(function(self, name, value) {
		self[name] = value;
	});
});

});
;object.define('ui2/aspect.js', function(require, exports, module) {
// TODOC: after/before/around return object
// TODOC: after/before/around param types. 

/*=====
	dojo.aspect = {
		// summary: provides aspect oriented programming functionality, allowing for
		//		one to add before, around, or after advice on existing methods.
		//
		// example:
		//	|	define(["dojo/aspect"], function(aspect){
		//	|		var signal = aspect.after(targetObject, "methodName", function(someArgument){
		//	|			this will be called when targetObject.methodName() is called, after the original function is called
		//	|		});
		//
		// example:
		//	The returned signal object can be used to cancel the advice.
		//	|	signal.remove(); // this will stop the advice from being executed anymore
		//	|	aspect.before(targetObject, "methodName", function(someArgument){
		//	|		// this will be called when targetObject.methodName() is called, before the original function is called
		//	|	 });
		
		after: function(target, methodName, advice, receiveArguments){
			// summary: The "after" export of the aspect module is a function that can be used to attach
			//		"after" advice to a method. This function will be executed after the original method
			//		is executed. By default the function will be called with a single argument, the return
			//		value of the original method, or the the return value of the last executed advice (if a previous one exists).
			//		The fourth (optional) argument can be set to true to so the function receives the original
			//		arguments (from when the original method was called) rather than the return value.
			//		If there are multiple "after" advisors, they are executed in the order they were registered.
			// target: Object
			//		This is the target object
			// methodName: String
			//		This is the name of the method to attach to.
			// advice: Function
			//		This is function to be called after the original method
			// receiveArguments: Boolean?
			//		If this is set to true, the advice function receives the original arguments (from when the original mehtod
			//		was called) rather than the return value of the original/previous method.
			// returns:
			//		A signal object that can be used to cancel the advice. If remove() is called on this signal object, it will
			//		stop the advice function from being executed.
		},
		
		before: function(target, methodName, advice){
			// summary: The "before" export of the aspect module is a function that can be used to attach
			//		"before" advice to a method. This function will be executed before the original method
			//		is executed. This function will be called with the arguments used to call the method.
			//		This function may optionally return an array as the new arguments to use to call
			//		the original method (or the previous, next-to-execute before advice, if one exists).
			//		If the before method doesn't return anything (returns undefined) the original arguments
			//		will be preserved.
			//		If there are multiple "before" advisors, they are executed in the reverse order they were registered.
			//
			// target: Object
			//		This is the target object
			// methodName: String
			//		This is the name of the method to attach to.
			// advice: Function
			//		This is function to be called before the original method	 
		},

		around: function(target, methodName, advice){
			// summary: The "around" export of the aspect module is a function that can be used to attach
			//		"around" advice to a method. The advisor function is immediately executed when
			//		the around() is called, is passed a single argument that is a function that can be
			//		called to continue execution of the original method (or the next around advisor).
			//		The advisor function should return a function, and this function will be called whenever
			//		the method is called. It will be called with the arguments used to call the method.
			//		Whatever this function returns will be returned as the result of the method call (unless after advise changes it).
			//
			// example:
			//		If there are multiple "around" advisors, the most recent one is executed first,
			//		which can then delegate to the next one and so on. For example:
			//		|	around(obj, "foo", function(originalFoo){
			//		|		return function(){
			//		|			var start = new Date().getTime();
			//		|			var results = originalFoo.apply(this, arguments); // call the original
			//		|			var end = new Date().getTime();
			//		|			console.log("foo execution took " + (end - start) + " ms");
			//		|			return results;
			//		|		};
			//		|	});
			//
			// target: Object
			//		This is the target object
			// methodName: String
			//		This is the name of the method to attach to.
			// advice: Function
			//		This is function to be called around the original method
		}

	};
=====*/

var nextId = 0;
function advise(dispatcher, type, advice, receiveArguments){
	var previous = dispatcher[type];
	var around = type == "around";
	var signal;
	if(around){
		var advised = advice(function(){
			return previous.advice(this, arguments);
		});
		signal = {
			remove: function(){
				signal.cancelled = true;
			},
			advice: function(target, args){
				return signal.cancelled ?
					previous.advice(target, args) : // cancelled, skip to next one
					advised.apply(target, args);	// called the advised function
			}
		};
	}else{
		// create the remove handler
		signal = {
			remove: function(){
				var previous = signal.previous;
				var next = signal.next;
				if(!next && !previous){
					delete dispatcher[type];
				}else{
					if(previous){
						previous.next = next;
					}else{
						dispatcher[type] = next;
					}
					if(next){
						next.previous = previous;
					}
				}
			},
			id: nextId++,
			advice: advice,
			receiveArguments: receiveArguments
		};
	}
	if(previous && !around){
		if(type == "after"){
			// add the listener to the end of the list
			var next = previous;
			while(next){
				previous = next;
				next = next.next;
			}
			previous.next = signal;
			signal.previous = previous;
		}else if(type == "before"){
			// add to beginning
			dispatcher[type] = signal;
			signal.next = previous;
			previous.previous = signal;
		}
	}else{
		// around or first one just replaces
		dispatcher[type] = signal;
	}
	return signal;
}
function aspect(type){
	return function(target, methodName, advice, receiveArguments){
		var existing = target[methodName], dispatcher;
		if(!existing || existing.target != target){
			// no dispatcher in place
			target[methodName] = dispatcher = function(){
				var executionId = nextId;
				// before advice
				var args = arguments;
				var before = dispatcher.before;
				while(before){
					args = before.advice.apply(this, args) || args;
					before = before.next;
				}
				// around advice
				if(dispatcher.around){
					var results = dispatcher.around.advice(this, args);
				}
				// after advice
				var after = dispatcher.after;
				while(after && after.id < executionId){
					results = after.receiveArguments ? after.advice.apply(this, args) || results :
							after.advice.call(this, results);
					after = after.next;
				}
				return results;
			};
			if(existing){
				dispatcher.around = {advice: function(target, args){
					return existing.apply(target, args);
				}};
			}
			dispatcher.target = target;
		}
		var results = advise((dispatcher || existing), type, advice, receiveArguments);
		advice = null;
		return results;
	};
}

return {
	before: aspect("before"),
	around: aspect("around"),
	after: aspect("after")
};

});
;object.define('ui2/optionsbase.js', 'events', function(require, exports, module) {
var events = require('events');

// 仿照 mootools 的overloadSetter，返回一个 key/value 这种形式的function参数的包装，使其支持{key1: value1, key2: value2} 这种形式
var enumerables = true, APslice = Array.prototype.slice;
for (var i in {toString: 1}) enumerables = null;
if (enumerables) enumerables = ['hasOwnProperty', 'valueOf', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'constructor'];
// func有可能是个method，需要支持传递self参数
this.overloadsetter = function(func) {
	return function() {
		var a = arguments[func.length - 2] || null;
		var b = arguments[func.length - 1];
		var passArgs = args = APslice.call(arguments, 0, func.length - 2);

		if (a === null) return this;
		if (typeof a != 'string') {
			for (var k in a) {
				args = passArgs.slice(0); // 复制，否则循环多次参数就越来越多了
				args.push(k);
				args.push(a[k]);
				func.apply(this, args);
			}
			if (enumerables) {
				for (var i = enumerables.length; i > 0; i--) {
					k = enumerables[i];
					if (a.hasOwnProperty(k)) func.call(this, k, a[k]);
				}
			}
		} else {
			args.push(a);
			args.push(b);
			func.apply(this, args);
		}
		return this;
	};
};

/**
 * Options构造器
 * 通过设置 getter1、setter1和setter三个成员，提供自定义的Options相关逻辑
 * 用OptionsClass来实现的目的是避免Options宿主类上存在过度辅助方法，用OptionsClass只会产生一个统一的引用变量
 */
this.OptionsClass = new Class(Type, function() {

	this.__new__ = function(cls, name, base, dict) {
		if (base === Object) {
			base = exports.Options;
		}
		return Type.__new__(cls, name, base, dict);
	};

	this.initialize = function(cls, name, base, dict) {
 		// 为了避免Options类上被放置过多的无关方法，统一将所有方法所在的metaclass类放到一个变量上
		cls.set('__optionsProvider', {
			getter1: cls.get('getter1'),
			setter1: cls.get('setter1'),
			setter: cls.get('setter')
		});
	};
});

// 暂时放在ui/options.js ，待搞清options.js的依赖后用这个替换之
this.Options = new Class(function() {

	this.initialize = function(self) {
		self._options = {};
	};

	/**
	 * 设置option的值
	 * 支持复杂name的设置
	 * comp.setOption('xxx', value) 设置comp的xxx
	 * comp.setOption('sub.xxx', value) 若comp.sub已存在，则赋值到comp.sub，若未存在，则comp.sub在建立时会被赋值
	 * @param name name
	 * @param value value
	 */
	this.getOption = function(self, name) {
		var getter1;
		if (self.__optionsProvider) {
			getter1 = self.__optionsProvider.getter1;
		}

		var parsed = self._options;
		var pointAt = name.indexOf('.');
		var p, l;
		var prefix, surfix;
		var value;

		// 直接找到
		if (pointAt == -1) {
			value = parsed[name];
			// 定义查找
			if (getter1) {
				value = getter1(self, name, value)[1];
			}
		}
		// 多重名字
		else {
			prefix = name.slice(0, pointAt);
			surfix = name.slice(pointAt + 1);
			p = surfix + '.';
			l = p.length;

			if (parsed[prefix]) {
				if (parsed[prefix][surfix] != undefined) {
					value = parsed[prefix][surfix];
				} else {
					value = {};
					Object.keys(parsed[prefix]).forEach(function(key) {
						if (key.indexOf(p) == 0) {
							value[key.slice(l)] = parsed[prefix][key];
						}
					});
				}
			}
		}

		return value;
	};

	/**
	 * 设置option的值
	 * @param name name
	 * @param value value
	 */
	this.setOption = exports.overloadsetter(function(self, name, value) {
		var setter1, setter;
		if (self.__optionsProvider) {
			setter1 = self.__optionsProvider.setter1;
			setter = self.__optionsProvider.setter;
		}

		var parsed = self._options;
		var pointAt = name.indexOf('.');
		var prefix, surfix;
		var prevented;

		// 直接name
		if (pointAt == -1) {
			if (setter1) {
				prevented = setter1(self, name, value, parsed[name]);
			}
			if (!prevented) {
				parsed[name] = value;
			}
		}
		// 子option
		else {
			prefix = name.slice(0, pointAt);
			surfix = name.slice(pointAt + 1);
			if (!parsed[prefix]) {
				parsed[prefix] = {};
			}
			if (setter) {
				prevented = setter(self, prefix, surfix, value);
			}
			if (!prevented) {
				parsed[prefix][surfix] = value;
			}
		}

	});
});

});
;object.define('ui2/options.js', './optionsbase, events', function(require, exports, module) {
var optionsmod = require('./optionsbase');
var events = require('events');

this.OptionsClass = new Class(optionsmod.OptionsClass, function() {

	this.customGetter = function(cls, self, name) {
		var meta = self.getMeta(name);
		if (!meta) {
			return undefined;
		}

		// 默认getter是从结构中通过data-前缀获取
		var getter = meta.getter || function(self) {
			if (!self._node) {
				return undefined;
			}
			var value = self._node.getData(name.toLowerCase());
			if (value != undefined) {
				return meta.ensureTypedValue(value);
			}
		};

		var getterValue = getter(self, name);
		return getterValue;
	};

	/**
	 * @param name 要获取的option的name
	 * @param seted 保存在_options上的value
	 */
	this.getter1 = function(cls, self, name, seted) {
		// 获取自己身上的option
		// 三个获取级别，优先级：结构(getter)>用户设置(setter)>默认(default)
		var meta = self.getMeta(name);
		var from, value;

		// meta不存在表示在获取一个没有注册的option
		if (!meta) {
			from = null;
			value = seted;
		}
		// 优先从结构中获取
		else if ((getterValue = cls.get('customGetter')(self, name)) !== undefined) {
			from = 'getter';
			value = getterValue;
		}
		// 其次是用户设置值
		else if (seted !== undefined) {
			from = 'setter';
			value = seted;
		}
		// 最后是defaultValue
		else {
			from = 'default';
			value = meta.defaultValue;
		}

		// 确保获取到的value得到更新
		self._set(name, value);

		return [from, value];
	};

	this.setter1 = function(cls, self, name, value, seted) {
		var valueInfo = cls.get('getter1')(self, name, seted);
		var from = valueInfo[0];
		var oldValue = valueInfo[1];

		// 未定义的option
		if (from == null) {
			return false;
		}
		// 从node获取，阻止普通option的修改
		else if (from == 'getter') {
			return true;
		}

		// 重复设置相同的value，阻止fireEvent，同时阻止设置到_options
		if (oldValue === value) {
			return true;
		}

		// 假设会prevent，阻止更新
		// 若没有prevent，fireevent的default会置prevented为false
		var prevented = true;
		(events.fireevent('__option_change_' + name, ['oldValue', 'value'])(function(self) {
			prevented = false;
			// 重新更新对象上的直接引用值
			self._set(name, value);
		}))(self, oldValue, value);
		return prevented;
	};

	this.setter = function(cls, self, prefix, surfix, value) {
		var sub = self[prefix];
		// 子引用已经存在
		if (sub && sub.setOption) {
			sub.setOption(surfix, value);
		}
		else if (prefix == '_node' || prefix == 'node') {
			self._node.set(surfix, value);
		}
	};

});

this.Options = new exports.OptionsClass(function() {
});

});
;object.define('ui2/decorators.js', 'events', function(require, exports, module) {
var events = require('events');

/**
 * @deprecated
 * use events.fireevent instead
 */
this.fireevent = events.fireevent;

});
object.add('./urlparse.js', function(exports) {

// 可以用于scheme的字符
var scheme_chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-.';

/**
 * 在字符串url中查找target字符后，利用result对象，返回截断后的前、后字符串
 * @param {Object} result 重复利用的用于返回结果的对象（避免太多内存垃圾产生）
 * @param {String} url 需要截取的url
 * @param {String} target 截断的字符组成的字符串
 * @param {Boolean} remainFirst 是否要保留匹配的字符
 *
 * @return {Object} 形如 {got:'', remained:''}的结果对象
 */
function splitUntil(result, url, target, remainFirst) {
	var min = url.length;
	for(var i=0, len = url.length; i < len; i++) {
		if (target.indexOf(url.charAt(i)) != -1) {
			if (i < min) {
				min = i;
				break;
			}
		}
	}
	result.got = url.substring(0, min);
	result.remained = (remainFirst? url.substring(min) : url.substring(min + 1));
	return result;
}

/**
 * 解析一个url为 scheme / netloc / path / params / query / fragment 六个部分
 * @see http://docs.python.org/library/urlparse.html
 * @example 
 * http://www.renren.com:8080/home/home2;32131?id=31321321&a=1#//music/?from=homeleft#fdalfdjal
 * --> 
 * [http, www.renren.com:8080, /home/home2, 32131, id=31321321&a=1, //music/?from=homeleft#fdalfdjal]
 */
function urlparse(url, default_scheme) {
	if (typeof url != 'string') {
		return ['', '', '', '', '', ''];
	}
	var scheme = '', netloc='', path = '', params = '', query = '', fragment = '', i = 0;
	i = url.indexOf(':');
	if (i > 0) {
		if (url.substring(0, i) == 'http') {
			scheme = url.substring(0, i).toLowerCase();
			url = url.substring(i+1);
		} else {
			for(var i=0, len = url.length; i < len; i++) {
				if (scheme_chars.indexOf(url.charAt(i)) == -1) {
					break;
				}
			}
			scheme = url.substring(0, i);
			url = url.substring(i + 1);
		}
	}
	if (!scheme && default_scheme) {
		scheme = default_scheme;
	}
	var splited = {};
	if (url.substring(0, 2) == '//') {
		splitUntil(splited, url.substring(2), '/?#', true);
		netloc = splited.got;
		url = splited.remained;
	}

	if (url.indexOf('#') != -1) {
		splitUntil(splited, url, '#');
		url = splited.got;
		fragment = splited.remained;
	}
	if (url.indexOf('?') != -1) {
		splitUntil(splited, url, '?');
		url = splited.got;
		query = splited.remained;
	}
	if (url.indexOf(';') != -1) {
		splitUntil(splited, url, ';');
		path = splited.got;
		params = splited.remained;
	}
	
	if (!path) {
		path = url;
	}
	return [scheme, netloc, path, params, query, fragment];
};

/**
 * 将兼容urlparse结果的url部分合并成url
 */
function urlunparse(parts) {
	if (!parts) {
		return '';
	}
	var url = '';
	if (parts[0]) url += parts[0] + '://' + parts[1];
	if (parts[1] && parts[2] && parts[2].indexOf('/') != 0) url += '/';
	url += parts[2];
	if (parts[3]) url += ';' + parts[3];
	if (parts[4]) url += '?' + parts[4];
	if (parts[5]) url += '#' + parts[5];

	return url;
};

/**
 * 合并两段url
 */
function urljoin(base, url) {
	// 逻辑完全照抄python的urlparse.py

	if (!base) {
		return url;
	}

	if (!url) {
		return base;
	}

	url = String(url);
	base = String(base);

	var bparts = urlparse(base);
	var parts = urlparse(url, bparts[0]);

	// scheme
	if (parts[0] != bparts[0]) {
		return url;
	}

	// netloc
	if (parts[1]) {
		return urlunparse(parts);
	}

	parts[1] = bparts[1];

	// path
	if (parts[2].charAt(0) == '/') {
		return urlunparse(parts);
	}

	// params
	if (!parts[2] && !parts[3]) {
		parts[2] = bparts[2];
		parts[3] = bparts[3];
		if (!parts[4]) {
			parts[4] = bparts[4];
		}
		return urlunparse(parts);
	}

    var segments = bparts[2].split('/').slice(0, -1).concat(parts[2].split('/'))

	// 确保能够生成最后的斜线
	if (segments[segments.length - 1] == '.') {
		segments[segments.length - 1] = '';
	}

	// 去掉所有'.'当前目录
	for (var i = 0, l = segments.length; i < l; i++) {
		if (segments[i] == '.') {
			segments.splice(i, 1);
			i--;
		}
	}

	// 合并所有'..'
	var i;
	while (true) {
		i = 1;
		n = segments.length - 1;
		while (i < n) {
			if (segments[i] == '..' && ['', '..'].indexOf(segments[i - 1]) == -1) {
				segments.splice(i - 1, 2);
				break;
			}
			i++;
		}
		if (i >= n) {
			break;
		}
	}

	if (segments.length == 2 && segments[0] == '' && segments[1] == '..') {
		segments[segments.length - 1] = '';
	}
	else if (segments.length >= 2 && segments[segments.length - 1] == '..') {
		segments.pop();
		segments.pop();
		segments.push('');
	}

	parts[2] = segments.join('/');

	return urlunparse(parts);
}

exports.urlparse = urlparse;
exports.urlunparse = urlunparse;
exports.urljoin = urljoin;

});

object.add('./validator.js', function(exports) {

this.isUrl = function(text) {
	return /^(?:(\w+?)\:\/\/([\w-_.]+(?::\d+)?))(.*?)?(?:;(.*?))?(?:\?(.*?))?(?:\#(\w*))?$/i.test(text);
};

this.isEmail = function(text) {
	return /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/i.test(text);
};

this.isIP = function(text) {
	return /^(0|[1-9]\d?|[0-1]\d{2}|2[0-4]\d|25[0-5]).(0|[1-9]\d?|[0-1]\d{2}|2[0-4]\d|25[0-5]).(0|[1-9]\d?|[0-1]\d{2}|2[0-4]\d|25[0-5]).(0|[1-9]\d?|[0-1]\d{2}|2[0-4]\d|25[0-5])$/.i.test(text);
}

});
// 此文件为objet的loader增加一个查找路径，为将来自动解析文件路径做准备
if (object.addPath) object.addPath('http://a.xnimg.cn/');
object.add('ua/extra.js', 'sys', function(exports, sys) {

	var uamodule = sys.modules['ua'];

	if (uamodule) {
		//将detectUAExtra挂接在模块上，用于在外部进行单元测试
		this.__detectUAExtra = detectUAExtra;
		var o = detectUAExtra();
		object.extend(uamodule.ua, o);
	}

	/**
	 * 检测UAExtra的主方法
	 *
	 * @param {String} ua userAgent字符串
	 */
	function detectUAExtra(ua) {
		if(!ua && typeof ua != 'string') {
			ua = navigator.userAgent;
		}
		/* Copy start here */

		var m, shell, o = {}, numberify = uamodule.numberify;
		/**
		 * 说明：
		 * @子涯总结的各国产浏览器的判断依据: http://spreadsheets0.google.com/ccc?key=tluod2VGe60_ceDrAaMrfMw&hl=zh_CN#gid=0
		 * 根据 CNZZ 2009 年度浏览器占用率报告，优化了判断顺序：http://www.tanmi360.com/post/230.htm
		 * 如果检测出浏览器，但是具体版本号未知用 0 作为标识
		 * 世界之窗 & 360 浏览器，在 3.x 以下的版本都无法通过 UA 或者特性检测进行判断，所以目前只要检测到 UA 关键字就认为起版本号为 3
		 */
		
		// 360Browser
		var getExternal = function(key){
			try{
				return window.external[key];
			}catch(e){
				return null;
			}
		}; 

		if (m = ua.match(/360SE/) || (getExternal('twGetRunPath') && window.external.twGetRunPath().indexOf('360se.exe') != -1)) {
			o[shell = 'se360'] = 3; // issue: 360Browser 2.x cannot be recognised, so if recognised default set verstion number to 3
		// Maxthon
		} else if (m = ua.match(/Maxthon|MAXTHON/) || getExternal('max_version')) {
			// issue: Maxthon 3.x in IE-Core cannot be recognised and it doesn't have exact version number
			// but other maxthon versions all have exact version number
			shell = 'maxthon';
			try {
				o[shell] = numberify(window.external['max_version']);
			} catch(ex) {
				o[shell] = 0;
			}
		// TT
		} else if (m = ua.match(/TencentTraveler\s([\d\.]*)/)) {
			o[shell = 'tt'] = m[1] ? numberify(m[1]) : 0;
		// TheWorld
		// 无法识别世界之窗极速版
		} else if (m = ua.match(/TheWorld/)) {
			o[shell = 'theworld'] = 3; // issue: TheWorld 2.x cannot be recognised, so if recognised default set verstion number to 3
		// Sogou
		} else if (m = ua.match(/SE\s([\d\.]*)/)) {
			o[shell = 'sogou'] = m[1] ? numberify(m[1]) : 0;
		// QQBrowser
		} else if (m = ua.match(/QQBrowser.([\d\.]*)/)) {
			o[shell = 'qqbrowser'] = m[1] ? numberify(m[1]) : 0;
		}

		// If the browser has shell(no matter IE-core or Webkit-core or others), set the shell key
		shell && (o.shell = shell);
		
		/* Copy end here */
		return o;
	}
});
object.add('ua/os.js', 'sys', function(exports, sys) {

var uamodule = sys.modules['ua'];

/**
 * 由于需要先替换下划线，与ua模块中的numberify不同，因此这里再定义此方法
 */
var numberify = function(s) {
	var c = 0;
	// convert '1.2.3.4' to 1.234
	return parseFloat(s.replace(/_/g, '.').replace(/\./g, function() {
		return (c++ === 0) ? '.' : '';
	}));
};

if (uamodule) {
	//将detectOS方法导出，便于单元测试
	this._detectOS = detectOS;
	var o = detectOS(navigator.userAgent.toLowerCase());
	object.extend(exports, o);
}

//判断对象obj是否是type类型
function is(obj, type) {
	type = type.replace(/\b[a-z]/g, function(match){
		return match.toUpperCase();
	});
	return Object.prototype.toString.call(obj) == '[object ' + type + ']';
}

//断言，如果bool不是true，则抛出异常消息msg
function assertTrue(bool, msg) {
	if(!bool) {
		throw new Error(msg);
	}
}

//断言，确保传入的obj不是空，如果为空，则抛出异常消息msg
function assertNotNull(obj, msg) {
	if(obj == null) {
		throw new Error(msg);
	}
}

/**
 * 传入ua，便于模拟ua字符串进行单元测试
 * @see http://forums.precentral.net/palm-pre-pre-plus/277613-webos-2-1-user-agent.html
 * @see http://www.developer.nokia.com/Community/Wiki/User-Agent_headers_for_Nokia_devices
 */
function detectOS(ua) {
	ua = ua || navigator.userAgent;
	ua = ua.toLowerCase();
	
	/**
	 * 所有的操作系统检测的配置项
	 *	{
	 *		core: 操作系统内核
	 *		match: 操作系统内核匹配，可以是正则表达式，也可以是function，function参数是userAgent字符串，返回值是true/false
	 *		versionRule：获取操作系统版本的正则表达式
	 *		version: 指定的操作系统版本值
	 *	} 
	 */
	var osDetecters = [
	{core: 'windowsnt',		match: function(ua) {
								return /windows\snt/.test(ua) && !/xblwp7/.test(ua);
							},						versionRule: /windows nt\s([\.\d]*)/},
	{core: 'windowsnt',		match: /windows\sxp/,	version: 5.1},
	{core: 'windowsnt', 	match: /windows\s2000/, version: 5.0},
	{core: 'windowsnt', 	match: /winnt/,			version: 4.0},
	{core: 'windows',		match: /windows me/,	version: 'me'},
	{core: 'windows',		match: /windows 98|win98/,version: '98'},
	{core: 'windows',		match: /windows 95|win95/,version: '95'},
	{core: 'windows',		match: /win16/,			version: '3.1'},
	{core: 'windows/phone',	match: /windows\sphone/,versionRule: /windows phone os ([\d\.]*)/},
	{core: 'windows/phone',	match: /xblwp7/,		version: 7.0},
	{core: 'windows/mobile',match: /windows mobile|wce|windows ce|pocket pc|wince/,	
													versionRule: /iemobile ([\.\d]*)/},
	{core: 'windows',		match: /win/,			version: 'unknown'},
	
	{core: 'android', 		match: /\sandroid/,		versionRule:/android ([^\s]*);/},

	{core: 'linux/debian',	match: /debian/, 		versionRule: /debian[\s\/-]([\.\d]*)/},
	{core: 'linux/redhat',	match: /red\shat/, 		versionRule: /red hat[\s\/-]([\.\d]*)/},
	{core: 'linux/fedora',	match: /fedora/, 		versionRule: /fedora[\s\/-]([\.\d]*)/},
	{core: 'linux/ubuntu',	match: /ubuntu/, 		versionRule: /ubuntu[\s\/-]([\.\d]*)/},
	{core: 'linux/suse',	match: /suse/, 			versionRule: /suse[\s\/-]([\.\d]*)/},
	{core: 'linux/mint',	match: /mint/, 			versionRule: /mint[\s\/-]([\.\d]*)/},
	{core: 'linux/centos',	match: /centos/, 		versionRule: /centos[\s\/-]([\.\d]*)/},
	{core: 'linux/gentoo',	match: /gentoo/, 		version: 'unknown'},
	{core: 'linux',			match: /linux/,			version: 'unknown'},

	{core: 'chromeos' ,		match: /cros/,  		version: 'unknown'},

	{core: 'unix/sunos' ,	match: /sunos/,  		version: 'unknown'},
	{core: 'unix/freebsd',	match: /freebsd/,  		version: 'unknown'},
	{core: 'unix/openbsd',	match: /openbsd/,  		version: 'unknown'},
	{core: 'unix/aix' ,		match: /aix/,  			version: 'unknown'},
	{core: 'unix/hp_ux' ,	match: /hp-ux/,  		version: 'unknown'},
	{core: 'unix',			match: /x11/,			version: 'unknown'},
	
	{core: 'macos' ,		match:/mac_powerpc|ppc/,version: 'ppc'},
	{core: 'macos' ,		match: /intel/,  		version: 'intel'},
	{core: 'macos' ,		match: /mac_68000|68k/, version: '68k'},
	{core: 'ios',			match: function(ua) {
		   						return /applewebkit/.test(ua) && / mobile\//.test(ua) && /like/.test(ua);
	   						},						versionRule: /os ([\_\.\d]*)/},
	{core: 'macos' ,		match: /mac/,  			version: 'unknown'},
	
	{core: 'os2' ,			match: function(ua) {
								return /os\/2|ibm-webexplorer/.test(ua) || navigator.appVersion.indexOf("os/2") != -1;
							},						version: 'unknown'},
	{core: 'symbian',		match: /symbian|s60|symbos|symbianos|series40|series60|nokian/,
													versionRule: /symbian(?:os)?\/([\d\.]*);/},
	{core: 'blackberry',	match: /blackberry|rim\stablet\sos/, 					
													versionRule: /(?:version\/|blackberry[\d]{4}\/)([\d\.]*)/},
	{core: 'webos', 		match: /webos/,			versionRule:/webos\/([^\s]*);/},
	{core: 'palmos',		match: /palmos/,		version: 'unknown'}
	];

	var o = {};

	//操作系统检测主逻辑
	for(var i=0, l=osDetecters.length, current, matchFlag = false; i<l; i++) {
		current = osDetecters[i];
		var match = current.match;
		//确保match是正则表达式或者是function
		assertTrue(is(match, 'RegExp') || is(match, 'Function'), 'match rule should be regexp or function');
		if(is(match, 'RegExp')) {
			//如果是正则表达式，则查看是否匹配
			matchFlag = match.test(ua);
		}else if(is(match, 'Function')) {
			//如果是方法，则执行，并传入ua作为参数
			matchFlag = match(ua);
			assertNotNull(matchFlag, 'match function must return true/false');
		} 
		//如果不匹配，则继续循环
		if(!matchFlag) {
			continue;
		}
		//执行到这里，说明已经匹配了
		var parent=null, packages=current.core.split('\/'), pLength=packages.length;
		if(pLength > 1) {
			//说明有子类型，比如windows/phone
			o.oscore = packages[0];
			parent = o;
			//构造子类型对象链
			for(var m=0; m<pLength - 1; m++) {				
				parent = parent[packages[m]] = {};
			}
		} else {
			o.oscore = current.core;
		}
		//获取版本信息
		var version = current.version || 'unknown';
		//如果有版本获取规则，则执行此规则，规则中必须取出版本号
		if(current.versionRule) {
			assertTrue(is(current.versionRule, 'RegExp'), 'version rule should be regexp');
			m = ua.match(current.versionRule);
			if(m && m[1]) version = numberify(m[1]);
		}
		//将版本信息放入返回的对象中
		if(parent) {
			parent[packages[pLength - 1]] = version;
		} else {
			o[o.oscore] = version;
		}
		break;
	}
	
	//如果是ios，继续判断移动设备
	if(o.ios) {
		m = ua.match(/ipad|ipod|iphone/);
		if (m && m[0]) {
			o[m[0]] = o.ios;
		}
	}
	//判断 Google Caja, from YUI-client
	if(navigator && navigator.cajaVersion) {
		o.caja = navigator.cajaVersion;
	}

	if(!matchFlag) {
		o.oscore = 'unknown';
	}

	//wow64  : Windows-On-Windows 64-bit
	//x64    : 64-bit windows version
	//win64  : Win32 for 64-Bit-Windows
	//ia64   : I-tanium 64-bit processor from Intel
	//sparc64: 64-bit Sun UltraSPARC processor
	//ppc64  : 64-bit PowerPC microprocessor
	//x86_64 : 64-bit Intel processor
	if (/wow64|x64|win64|ia64|x86_64|amd64|sparc64|ppc64/.test(ua)){
		o.processor = 64;
	} else {
		o.processor = 32;
	}
	
	//检测分辨率（devicePixelRatio说明是高密度的显示屏，如iphone）
	//http://developer.android.com/guide/webapps/targeting.html
	if(window.devicePixelRatio >= 2) {
		o.resolution = {
			width : screen.width  * window.devicePixelRatio,
			height: screen.height * window.devicePixelRatio
		};
	} else {
		o.resolution = {
			width: screen.width,
			height: screen.height
		}
	}

	//检测屏幕方向，首先确保支持屏幕方向
	var supportOrientation = typeof window.orientation != 'undefined' ? true : false;
	if(supportOrientation) {
		if(window.innerWidth != undefined) {
			//通过屏幕的高度和宽度的值大小，来判断是横向还是纵向
			//如果是宽度大于高度，则是landscape，否则是profile
			o.orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'profile';
		} else {
			o.orientation = window.screen.width > window.screen.height ? 'landscape' : 'profile';
		}
	} else {
		o.orientation = 'unknown';
	}

	return o;
}
});

object.add('ua/flashdetect.js', function(exports) {

/**
* getFlashVersionv Flash Player version detection http://stauren.net
* released under the MIT License:
* http://www.opensource.org/licenses/mit-license.php
*/
this.getFlashVersion = function(){
	var _ver = false;
	if(navigator.plugins&&navigator.mimeTypes.length){
		var x=navigator.plugins["Shockwave Flash"];
		if(x&&x.description){
			_ver=x.description.replace(/([a-zA-Z]|\s)+/,"").replace(/(\s+r|\s+b[0-9]+)/,".").split(".")[0];
		}
	} else {
		if(navigator.userAgent&&navigator.userAgent.indexOf("Windows CE")>=0) {
			var axo=1;
			var _tempVer=3;
			while(axo) {
				try{
					_tempVer++;
					axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash."+_tempVer);
					_ver=_tempVer;
				} catch(e) {
					axo=null;
				}
			}
		} else {
			try {
				var axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.7");
			} catch(e) {
				try {
					var axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash.6");
					_ver=6;
					axo.AllowScriptAccess="always";
				} catch(e) {
					if(_ver==6){
						return _ver;
					}
				}
				try {
					axo=new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
				} catch(e) {}
			}
			if(axo!=null) {
				_ver= axo.GetVariable("$version").split(" ")[1].split(",")[0];
			}
		}
	}
	return _ver;
}

});
/**
 * @namespace XN
 * @property DEBUG_MODE
 * @type {Boolean}
 */
object.add('XN', 'dom, ua', function(exports, dom, ua) {

	this.DEBUG_MODE = false;
	
	//为了避免对env模块的依赖，这里定义变量保存env.staticRoot的值
	var _staticRoot = 'http://s.xnimg.cn/';

	/**
	 *  log message if the browser has console object
	 * @method log
	 * @param {Any} s
	 */

	/**
	 * @class debug
	 * @static
	 */
	this.debug = {
	
		/**
		 * log message if the browser has console object
		 * @method log
		 * @param {Any} s
		 */
		log : function(){},
		
		/**
		 * debug mode on
		 * @method on
		 */
		on : function() {
			exports.DEBUG_MODE = true;
			if ( window.console && console.log )
			{
				exports.debug.log = function( s )
				{
					console.log( s );
				}
			}
		},
		
		/**
		 * debug mode off
		 * @method off
		 */
		off : function() {
			exports.debug.log = function(){};
		}
	};

	/**
	 * based on YAHOO.namespace
	 * @namespace XN
	 * @method namespace
	 * @param  {String*} arguments 1-n namespaces to create 
	 * @return {Object}  A reference to the last namespace object created
	 */
	this.namespace = function() {
		var a = arguments, o = null, i, j, d;
		for (i = 0 ; i < a.length ; i++) {
			d = a[i].split('.');
			o = exports;

			for (j = (d[0] == 'XN') ? 1 : 0; j < d.length; j++) {
				o[d[j]] = o[d[j]] || {};
				o = o[d[j]];
			}
		}
		return o;		
	};
	
	this.log = function( s ) {
		exports.debug.log( s );
	}
	
	/**
	 * @method isUndefined
	 * @param {Any} object
	 * @return {Boolean}
	 */
	this.isUndefined = function (object) {
		return typeof object == 'undefined';
	}

	/**
	 * @method isString
	 * @param {Any} object
	 * @return {Boolean}
	 */
	this.isString = function (object) {
		return typeof object == 'string';
	}

	/**
	 * @method isElement
	 * @param {Any} object
	 * @return {Boolean}
	 */
	this.isElement = function (object) {
		return object && object.nodeType == 1;
	}

	/**
	 * @method isFunction
	 * @param {Any} object
	 * @return {Boolean}
	 */
	this.isFunction = function (object) {
		return typeof object == 'function';
	}

	/**
	 * @method isObject
	 * @param {Any} object
	 * @return {Boolean}
	 */
	this.isObject = function (object) {
		return typeof object == 'object';
	}

	/**
	 * @method isArray
	 * @param {Any} object
	 * @return {Boolean}
	 */
	this.isArray = function (object) {
		return Object.prototype.toString.call(object) === '[object Array]';
	}

	/**
	 * @method isNumber
	 * @param {Any} object
	 * @return {Boolean}
	 */
	this.isNumber = function (object) {
		return typeof object == 'number';
	}

	/**
	 * modify by shuangbao.li at 2010.4.26
	 * extend an object
	 * @method $extend
	 * @param {Object} object the object for extend
	 */
	this.$extend = function () {
		var result = arguments[0];
		for(var i=1; i<arguments.length; i++) {
			if(typeof arguments[i] == 'object') {
				for(var key in arguments[i])
					result[key] = arguments[i][key];
			}
		}
		return result;
	}

	/*
	 * patch for old version
	 */
	this.namespace('config');
	this.config.jumpOut = false;

	(function() {
		var files = {};
		var version = {};

		exports.getFileVersionNum = function(file){
			return version[file]; 
		}
		
		function hasLoad( file ){
			//return false; // 避免出现不能第二次加载同一个文件
			return !!getFile( file );
		}

		function getFile( file ){
			return files[ encodeURIComponent( file ) ];
		}
		
		function mark( file ){
			var obj = {};
			obj.file = file;
			obj.isLoad = true;
			obj.isLoaded = true;
			files[ encodeURIComponent( file ) ] = obj;
		}

		// 为了避免依赖event模块，这里重新实现了event.enableCustomEvent方法
		function enableCustomEvent( target ) {
			target.addEvent = function(type, func) {
				if(!this._customEventListeners) {
					this._customEventListeners = {};
				}
				var funcs = this._customEventListeners;
				if(exports.isUndefined(funcs[type])) {
					funcs[type] = [];
				}
				funcs[type].push(func);
				return this;
			},
			target.delEvent = function(type, func) {
				var funcs = this._customEventListeners[type];
				if (funcs) {
					for(var i = funcs.length - 1; i >= 0; i--) {
						if(funcs[i] == func) {
							funcs[i] = null;
							break;
						}
					}
				}
				return this;
			},
			target.fireEvent = function(type) {
				if(!this._customEventListeners || !this._customEventListeners[type]) {
					return;
				}
				var funcs = this._customEventListeners[type], ars = buildArray(arguments);
				ars.shift();
				for(var i = 0, j = funcs.length; i < j; i++) {
					if(funcs[i]) {
						try { 
                            funcs[i].apply(this, ars);
                        } catch(ox) {
                            if (exports.DEBUG_MODE) {
								throw ox;
							}
                        }
						
					}
				}
			}
		}

		// 为了避免对array模块的依赖，这里重新实现了array.build方法
		function buildArray(o) {
			var rt = [];
			for (var i = 0, j = o.length; i < j; i++) {
				rt.push(o[i]);
			}
			return rt;
		}

		function addFile( file, disClear ){
			var obj = {};
			obj.file = file;
			obj.isLoaded = false;
			enableCustomEvent( obj );
			
			obj.addEvent( 'load' , function(){
				this.isLoaded = true;
			});

			// 如果disClear，则不保存此addFile的信息，也就不会被clear掉了
			if (!disClear) {
				files[ encodeURIComponent( file ) ] = obj;
			}

			var el = document.createElement('script');
			el.type="text/javascript";
			el.src = file;
			el.async = true;
			obj.element = el;
			
			if (ua.ua.shell == 'ieshell') {
				el.onreadystatechange = function() {
					if ( ( this.readyState == 'loaded' || this.readyState == 'complete' ) && !this.hasLoad ){
						this.hasLoad = true;
						var _file = getFile(file);
						if (_file != null) {
							_file.fireEvent('load');
						} else {
							try {
								exports.loadFile(file);
							} catch(e) {}
						}
					}
				}
			} else {
				el.onerror = el.onload = function() {
					var tmp = getFile( file );
					if (tmp) tmp.fireEvent( 'load' );
					// 之前的写法是 getFile(file).fireEvent('load')
					// 由于在快速切换的时候，会出现js未加载完毕，元素就被干掉了的情况
					// 因此在这里判断一下
				};
			}

			Sizzle('head')[0].insertBefore(el, null);
		}

		function loadFile( file , callBack , disCache, disClear) {
			var isJS = false, isCSS = false;

			if ( exports.isObject(file) ) {
				isJS = ( file.type == 'js' );
				isCSS = ( file.type == 'css' );
				file = file.file;
			}

			file = getFullName( file );
			
			if ( /\.js(\?|$)/.test( file ) || isJS ) {
					
				if ( disCache || !hasLoad( file ) ) {
					addFile( file, disClear );
				}
				
				if ( !callBack ) return;
				if ( getFile( file ).isLoaded ) {
					callBack.call( getFile( file ), true );
				} else {
					getFile( file ).addEvent( 'load' , function() {callBack(true)} );
					getFile( file ).addEvent( 'error' , function() {callBack(false)} );
				}
			} else if ( /\.css(\?|$)/.test( file ) || isCSS ) {
				if ( !disCache && hasLoad( file ) ) {
					if ( callBack ) callBack.call( getFile( file ) );
					return;
				}
				mark( file );
				var el = document.createElement( 'link' );
				el.rel = 'stylesheet';
				el.type = 'text/css';
				el.href = file;
				
				Sizzle('head')[0].insertBefore(el, null);
				if ( callBack ) callBack.call( getFile( file ) );
			}
		}
		
		function getFullName( file ) {
			runOnce( loadVersion );
			if ( !version[ file ] ) return file;
			return version[ file ].file;
		}

		//存储两个正则表达式，避免在每次调用getVersion时都重新定义
		var regWithA = new RegExp( '(' + _staticRoot + ')' + '(a?\\d+)/([^\?]*)' );
		var regWithVer = new RegExp( '(.*)\\?ver=(\d+)(\..*)' );

		function getVersion( file ) {
			var match;
			if ( match = regWithA.exec( file ) ) {
				version[ match[ 1 ] + match[ 3 ] ] = {
					file : file,
					version : match[ 2 ]
				};
			} else if ( match = regWithVer.exec( file ) ) {
				version[ match[ 1 ] ] = {
					file : file,
					version : match[ 2 ]
				};
			}
		}
		
		exports.getFileVersion = function( files ) {
			files.forEach(function( v , i ) {
				getVersion( v );
			});
		};

		exports.loadFile = function( file , callBack , disCache){
			dom.ready(function() {
				loadFile( file , callBack , disCache );	
			});
		};

		// 不会被清掉引用的loadFile
		exports.loadFileForever = function(file, callBack, disCache) {
			dom.ready(function() {
				loadFile( file , callBack , disCache, true);	
			});
		}

		exports.unloadFile = function(node) {
			if (node.parentNode) {
				node.parentNode.removeChild(node);
				files[ encodeURIComponent( node.src ) ] = null;
			}
		}

		exports.clearFiles = function() {
			for (var i in files) if (files.hasOwnProperty(i)) {
				if (files[i] && files[i].element) exports.unloadFile(files[i].element);
			}
		}
		
		exports.loadFiles = function( files , callBack ) {
			var f = files.length;
			
			function isAllLoad() {
				f --;
				if ( f === 0 && callBack ) callBack();
			}

			files.forEach(function( v , i ) {
				exports.loadFile( v , isAllLoad );
			});
		};

		exports.getVersion = function( file ) {
			getVersion( file );
		}

		function loadVersion() {

			buildArray(document.getElementsByTagName( 'script' )).forEach(function( v , i ) {
				if ( v.src ) {
					mark( v.src );
					getVersion( v.src );
				}

				if ( v.getAttribute( 'vsrc' ) ) {
					getVersion( v.getAttribute( 'vsrc' ) );
				}
			} );

			buildArray(document.getElementsByTagName( 'link' )).forEach(function( v , i ) {
				if ( v.rel && v.rel == 'stylesheet' ) {
					mark( v.href );
					getVersion( v.href );
				}

				if ( v.getAttribute( 'vhref' ) ) getVersion( v.getAttribute( 'vhref' ) );
			} );

			exports.log( 'load file version:' );
			exports.log( version );
		}

		exports.dynamicLoad = function( file ) {
			 file.funcs.forEach(function( func , i ) {
				window[ func ] = function() {
					var ars = arguments;
					
					window[ func ] = null;
					if ( file.file ) {
						file.files = [ file.file ];
					}

					exports.loadFiles( file.files , function() {
						window[ func ].apply( null , ars );
						if ( file.callBack ) file.callBack.call( null );
					});
				};    
			});
		};

		exports.namespace( 'img' );
		exports.img.getVersion = function( file ) {
			runOnce( loadVersion );
			if ( !version[ file ] ) return '';
			return version[ file ].version;
		};

		exports.img.getFullName = function( file ) {
			return getFullName( file );
		};

		// 为了避免对func模块的依赖，这里重新实现了func.runOnce方法
		function runOnce(func) {
			if(window.runOnceFunc == null) {
				window.runOnceFunc = {};
			}
			if(window.runOnceFunc[func]) {
				return null;
			}
			window.runOnceFunc[func] = true;
			return func();
		}
	})();
});

/**
 * @namespace XN
 * @class array
 * @static
 */
object.add('XN.array', 'XN', function(exports, XN) {

	/**
	 * build query string from array
	 * @method toQueryString
	 * @param {Array | hash} a
	 * @return {String}
	 */
	this.toQueryString = function(a, key) {
		var rt = [], t;
		for (var k in a) {
			t = a[k];
			if (XN.isFunction(t)) continue;
			if (XN.isObject(t)) {
				rt.push(arguments.callee(t, k));
			} else {
				if (/^\d+$/.test(k)) {
					rt.push((key || k) + '=' + encodeURIComponent(t));
				} else {
					rt.push(k + '=' + encodeURIComponent(t));
				}	
			}
		}
		return rt.join('&');
	}
	
	/**
	 * Iterates over the array
	 * the callBack function will receive index and value as the parameters
	 * @method each
	 * @param {Array} a
	 * @param {Function} func callBack function
	 */
	this.each = function(a, func) {
        if (!a) return;

		if (!XN.isUndefined(a.length) || !XN.isUndefined(a[0])) {
			for (var i = 0, j = a.length; i < j; i++) {
				if (func.call(a, i, a[i]) === false) break;
			}
		} else {
			for (var key in a) {
				if(!XN.isFunction(a[key])) {
					if (func.call(a, key, a[key]) === false) break;
				}
			}
		}
	}
	
	/**
	 * check if an array has item equal the value param
	 * @method include
	 * @param {Array} a
	 * @param {Any} value
	 * @return {Boolean}
	 */
	this.include = function(a, value) {
		var r = false;
		
		exports.each(a, function(i, v) {
			if (v === value) {
				r = true;
				return false;
			}
		});
		
		return r;
	}
	
	/**
	 * build array from an object like arguments
	 * @method build
	 * @param {Object} obj
	 * @return {Array}
	 */
	this.build = function(o) {
		var rt = [];
		for (var i = 0, j = o.length; i < j; i++) {
			rt.push(o[i]);
		}
		return rt;
	}
});
/**
 * @namespace XN
 * @class func
 * @static
 */
object.add('XN.func', function(exports) {

	if(window.runOnceFunc == null) {
		window.runOnceFunc = {};
	}
	
	/**
	 * refer to an empty function
	 * @property empty
	 * @type {Function}
	 */
	this.empty = function(){};
	
	/**
	 * run a function only once
	 * @method runOnce
	 * @param {Function} func
	 * @return {Any} the result the func return
	 */
	this.runOnce = function(func) {
		if(window.runOnceFunc[func]) {
			return null;
		}
		window.runOnceFunc[func] = true;
		return func();
	}
});

/**
 * @namespace XN
 * @class string
 * @static
 */
object.add('XN.string', 'XN', function(exports, XN) {
	
	/**
	 * replace '\n' with '<br />'
	 * @method nl2br
	 * @param {String} str
	 * @return {String}
	 */
	this.nl2br = function(str) {
		return (str || '').replace(/([^>])\n/g, '$1<br />');
	};
	
	/**
	 * trim whitespace
	 * @method trim
	 * @param {String} str
	 * @return {String}
	 */
	this.trim = function(str) {
		return (str || '').replace(/^\s+|\s+$/g, '');
	};
	
	/**
	 * trim whitespace leftside
	 * @method ltrim
	 * @param {String} str
	 * @return {String}
	 */
	this.ltrim = function(str) {
		return (str || '').replace(/^\s+/, '');
	};

	/**
	 * trim whitespace rightside
	 * @method rtrim
	 * @param {String} str
	 * @return {String}
	 */
	this.rtrim = function(str) {
		return (str || '').replace(/\s+$/, '');
	};
	
	this.strip = function(str) {
    	return exports.trim(str);
	};
	
	/**
	 * remove tag like '<...>'
	 * @method stripTags
	 * @param {String} str
	 * @return {String}
	 */
	this.stripTags = function(str) {
		return str.replace(/<\/?[^>]+>/igm, '');
	};
	
	/**
	 * replace char like '<','>' to '&lt;'...
	 * @method escapeHTML
	 * @param {String} str
	 * @return {String}
	 */
	this.escapeHTML = function(str) {
		return str.replace(/&/g ,'&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
	};
	
	/**
	 * replace '&lt;'... to '<'...
	 * @method unescapeHTML
	 * @param {String} str
	 * @return {String}
	 */
	this.unescapeHTML = function(str) {
		return str.replace(/&lt;/g ,'<')
		.replace(/&gt;/g, '>')
		.replace(/&nbsp;/g ,' ')
		.replace(/&quot;/g, '"')
		.replace(/&amp;/g, '&');
	};
	
	/**
	 * if str include the keyword will return true 
	 * @method include
	 * @param {String} str
	 * @param {String} key the keyword
	 * @return {Boolean}
	 */
	this.include = function(str, key) {
		return str.indexOf(key) > -1;
	};

	/**
	 * wether str starts with the keyword
	 * @method startsWith
	 * @param {String} str
	 * @param {String} key the keyword
	 * @return {Boolean}
	 */
	this.startsWith = function(str, key) {
		return str.indexOf(key) === 0;
	};

	/**
	 * wether str ends with the keyword
	 * @method endsWith
	 * @param {String} str
	 * @param {String} key the keyword
	 * @return {Boolean}
	 */
	this.endsWith = function(str, key) {
	    var d = str.length - key.length;
	    return d >= 0 && str.lastIndexOf(key) === d;	
	};
	
	/**
	 * check if the string is 'blank',meaning either empty or containing only whitespace
	 * @method isBlank
	 * @param {String} str
	 * @return {Boolean}
	 */
	this.isBlank = function(str) {
		return /^\s*$/.test(str);
	};
	
	/**
	 * wether a string is an email address
	 * @method isEmail
	 * @param {String} str
	 * @return {Boolean}
	 */
	this.isEmail = function(str) {
		return /^[A-Z_a-z0-9-\.]+@([A-Z_a-z0-9-]+\.)+[a-z0-9A-Z]{2,4}$/.test(str);
	};
	
	/**
	 * wether a string is mobile phone number
	 * @method isMobile
	 * @param {String} str
	 * @return {Boolean}
	 */
	this.isMobile = function(str) {
        return /^((\(\d{2,3}\))|(\d{3}\-))?((1[345]\d{9})|(18\d{9}))$/.test(str);
	};
	
	/**
	 * @method isUrl
	 * @param {String} str
	 * @return {Boolean}
	 */	
	this.isUrl = function(str) {
		return /^(http:|ftp:)\/\/[A-Za-z0-9]+\.[A-Za-z0-9]+[\/=\?%\-&_~`@[\]\':+!]*([^<>\"])*$/.test(str);
	};
	
	/**
	 * @method isIp
	 * @param {String} str
	 * @return {Boolean}
	 */
	this.isIp = function(str) {
		return /^(0|[1-9]\d?|[0-1]\d{2}|2[0-4]\d|25[0-5]).(0|[1-9]\d?|[0-1]\d{2}|2[0-4]\d|25[0-5]).(0|[1-9]\d?|[0-1]\d{2}|2[0-4]\d|25[0-5]).(0|[1-9]\d?|[0-1]\d{2}|2[0-4]\d|25[0-5])$/.test(str);
	};
	
	/**
	 * @method XN.isNumber
	 * @param {String} str
	 * @return {Boolean}
	 */
	this.isNumber = function(str) {
		return /^\d+$/.test(str);
	};

	/**
	 * @method isZip
	 * @param {String} str
	 * @return {Boolean}
	 */
	this.isZip = function(str) {
		return /^[1-9]\d{5}$/.test(str);
	};
	
	/**
	 * @method isEN
	 * @param {String} str
	 * @return {Boolean}
	 */
	this.isEN = function(str) {
		return /^[A-Za-z]+$/.test(str);
	};

	/**
	 * @method isJSON
	 * @param {String} str
	 * @return {Boolean}
	 */
	this.isJSON = function(str) {
		if (!XN.isString(str) || str === '') {
			return false;
		}
		str = str.replace(/\\./g, '@').replace(/"[^"\\\n\r]*"/g, '');
		return (/^[,:{}\[\]0-9.\-+Eaeflnr-u \n\r\t]*$/).test(str);	
	};
    
    /**
     * get parameters from url
     * @method getQuery
     * @param {String} key
     * @param {String} url
     * @return {String | Array}
     */
    this.getQuery = function(key, url) {
        url = url || window.location.href + '';
        if (url.indexOf('#') !== -1) {
            url = url.substring(0, url.indexOf('#'));
		}
        var rts = [], rt;
        var queryReg = new RegExp('(^|\\?|&)' + key + '=([^&]*)(?=&|#|$)', 'g');
        while ((rt = queryReg.exec(url)) != null) {
            rts.push(decodeURIComponent(rt[2]));
        }
        if (rts.length == 0) return null;
        if (rts.length == 1) return rts[0];
        return rts;
    };
    
    /**
     * set parameters for url
     * @method setQuery
     * @param {String} key
     * @param {String | Array} value
     * @param {String} url
     * @return {String}
     */
    this.setQuery = function(key, value, url) {
        url = url || window.location.href + '';
        var hash = '';
        if (!/^http/.test(url)) {
			return url;
		}
        if (url.indexOf('#') !== -1) {
            hash = url.substring(url.indexOf('#'));
        }
        url = url.replace(hash, '');
        url = url.replace(new RegExp('(^|\\?|&)' + key + '=[^&]*(?=&|#|$)', 'g'), '');
        value = XN.isArray(value) ? value : [value];
        
        for (var i = value.length - 1;i >= 0;i --) {
            value[i] = encodeURIComponent(value[i]);
        }

        var p = key + '=' + value.join('&' + key + '=');
        return url + (/\?/.test(url) ? '&' : '?') + p + hash;
    };
	
	this.isNum = this.isNumber;
});
/**
 *  based on YUI:YAHOO.lang.JSON 
 */
object.add('XN.json', function(exports) {
	this._PARSE_DATE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})Z$/;
	
    this.dateToString = function (d) {
        function _zeroPad(v) {
            return v < 10 ? '0' + v : v;
        }

        return '"' + d.getUTCFullYear()   + '-' +
            _zeroPad(d.getUTCMonth() + 1) + '-' +
            _zeroPad(d.getUTCDate())      + 'T' +
            _zeroPad(d.getUTCHours())     + ':' +
            _zeroPad(d.getUTCMinutes())   + ':' +
            _zeroPad(d.getUTCSeconds())   + 'Z"';
    }
	
    this.stringToDate = function (str) {
        if (exports._PARSE_DATE.test(str)) {
            var d = new Date();
            d.setUTCFullYear(RegExp.$1, (RegExp.$2|0)-1, RegExp.$3);
            d.setUTCHours(RegExp.$4, RegExp.$5, RegExp.$6);
            return d;
        }
    }
	
	this.parse = function(str){
        return eval('(' + str + ')');
	}
	
	this.build = function(o,w,d){
		// 用object带的json
		return JSON.stringify(o, w, d);
	}
});

/**
 * 常用功能的封装
 * @namespace XN
 * @class util
 * @static
 */
object.add('XN.util', 'XN, XN.json, XN.array, XN.event, XN.string', function(exports, XN) {
	
	if(!window.__timeouts == null) {
		window.__timeouts = [];
		window.__intervals = [];
	}

	this.setTimeout = function(a, b) {
		var timer = setTimeout(a, b);
		window.__timeouts.push(timer);
		return timer;
	}

	this.setInterval = function(a, b) {
		var timer = setInterval(a, b);
		window.__intervals.push(timer);
		return timer;
	}

	this.clearTimeout = function(timer) {
		for (var i = 0; i < window.__timeouts.length; i++) {
			if (window.__timeouts[i] == timer) window.__timeouts.slice(i, 1);
		}
		clearTimeout(timer);
	}

	this.clearInterval = function(timer) {
		for (var i = 0; i < window.__intervals.length; i++) {
			if (window.__intervals[i] == timer) window.__intervals.slice(i, 1);
		}
		clearInterval(timer);
	}

	this.clearAllTimer = function() {
		for (var i = 0; i < window.__timeouts.length; i++) clearTimeout(window.__timeouts[i]);
		for (var i = 0; i < window.__intervals.length; i++) clearInterval(window.__intervals[i]);
		window.__timeouts = [];
		window.__intervals = [];
	}

	/**
	 * data cache class
	 * @class cache
	 * @constructor
	 * @param {Object} params
	 */
	this.cache = function(params) {
		XN.$extend(this, params);
		this._cacheData = [];
	};

	this.cache.prototype = {
		
		/**
		 * @property cacheLength
		 * @type {Int}
		 */
		cacheLength : null,
		
		_cacheData : null,
		
		/**
		 * check if the cahe key exist
		 * @method isExist
		 * @param {String | Int} key
		 * @return {Boolean}
		 */
		isExist : function(key) {
			return this.get(key);
		},
		
		/**
		 * add a cache data
		 * @method add
		 * @param {String | Int} key
		 * @param {Any} value
		 */
		add : function(key ,value) {
			if (!XN.isUndefined(this.isExist(key))) return;
			
			if (this.cacheLength && this.cacheLength == this._cacheData.length) {
				this._cacheData.shift();
			}
			
			this._cacheData.push({
				'key'	:	key,
				'value':	value
			});
		},
		
		/**
		 * get cache data by key
		 * @method get
		 * @param {String | Int} key
		 * @return {Any}
		 */
		get : function(key) {
			for (var i = this._cacheData.length - 1 ; i >= 0 ; i--) {
				if(this._cacheData[i].key == key) {			
					return this._cacheData[i].value;
				}
			}		
		},
		
		/**
		 * clear cache
		 * @method clear
		 */
		clear : function() {
			this._cacheData = [];
		}	
	};

	/**
	 * 全局热键
	 * @class hotKey
	 * @static
	 */
	(function() {
		var funcs = {};

		exports.hotKey = {

			/**
			 * 添加热键
			 * <pre>
			 * XN.util.hotKey.add('27', callBack);
			 * XN.util.hotKey.add('ctrl+27', callBack);
			 * </pre>
			 * @method add
			 * @param {String} key
			 * @param {Function} func
			 * @obj {Object} obj
			 */
			add : function(key, func, obj) {
				key = String(key).toLowerCase();
				var ctrl = false;
				var alt = false;
				var shift = false;
				var _code = null;

				if (/^\d+$/.test(key)) {
					_code = parseInt(key);
				} else {
					ctrl = /ctrl|ctr|c/.test(key);
					alt = /alt|a/.test(key);
					shift = /shift|s/.test(key);
					if (/\d+/.test(key)) {
						_code = parseInt(/\d+/.exec(key)[0]);
					} else {
						_code = false;
					}
				}

				funcs[key] = funcs[key] || {};

				funcs[key][func] = function(e) {
					e = e || window.event;
					code = e.keyCode;
					if (ctrl && !e.ctrlKey) return;
					if (alt && !e.altKey) return;
					if (shift && !e.shiftKey) return;
					if (_code && code !== _code) return;
					func.call(obj || null);
					XN.event.stop(e);
				};
				XN.event.addEvent(document, 'keydown', funcs[key][func]);
			},
			
			/**
			 * 删除热键
			 * <pre>
			 * XN.util.hotKey.del('27', callBack);
			 * </pre>
			 * @method del
			 * @param {String} key
			 * @param {Function} func
			 */
			del : function(key, func) {
				key = String(key).toLowerCase();
				XN.event.delEvent(document, 'keydown', funcs[key][func]);
				delete funcs[key][func];
			}
		};
	})();

	(function() {
		var id = 0;
		exports.createObjID = function() {
		  id ++;
		  return id;
		};
	})();

	// DS_JSON DS_XHR DS_friends DS_array 四个成员已移至 XN.datasource 模块

});
object.add('XN.datasource', 'XN, XN.json, XN.net, XN.string, XN.array', function(exports, XN) {

	/**
	 * json格式的ajax数据源
	 * <pre>
	 *  参数形式如下
	 *  <pre>
	 *  {
	 *      url:'',//查询的url
	 *      queryParam:'query',//查询的参数名
	 *      attachParam:'',//附加参数
	 *      rootKey:null//如果不指定，则认为整个json即为查询结果
	 *  }
	 *  </pre>
	 * </pre>
	 *
	 * @class DS_JSON
	 * @constructor
	 * @param {Object} params
	 */

	this.DS_JSON = function(p) {
		XN.$extend(this, p);
	};

	this.DS_JSON.prototype  = {
		DS_TYPE : 'JSON',
		url : null,
		queryParam : 'query',
		attachParam : '',
		rootKey : null,
		method : 'get',
		_request : null,

		/**
		 * 查询数据
		 * @method query
		 * @param {String} v 查询的字符串
		 * @param {Function} callBack 回调函数
		 */
		query : function(v, callBack) {
			var This = this;
			
			try {
				this._request.abort();
			} catch(e){}
			
			function parseDS_JSON(r) {
				r = r.responseText;
				var pp;
				try {
					var rt = XN.json.parse(r);
					if (This.rootKey && rt[This.rootKey]) {
						pp = rt[This.rootKey];
					} else {
						pp = rt;
					}
				}
				catch(e) {
					pp = [];
				}
				callBack(pp);
			}
			
			this._request = new XN.net.xmlhttp({
				url : this.url,
				data : this.queryParam + '=' + encodeURIComponent(v) + '&' + this.attachParam,
				method : this.method,
				onSuccess : parseDS_JSON
			});
		}
	};

	/**
	 * 用于好友选择器的好友数据源
	 * <pre>
	 * 参数形式如下
	 * {
	 *  url:''//请求的url
	 * }
	 * </pre>
	 * @class DS_friends
	 * @constructor
	 * @param {Object} params
	 */

	/**
	 * 如果指定了此属性，将在此网络内查询好友
	 * @property net
	 * @type {String}
	 */

	/**
	 * 如果指定了此属性，将在此分组内查询好友
	 * @property group
	 * @type {String}
	 */


	/**
	 * 查询好友
	 * @method query
	 * @param {String} name
	 * @param {Function} callBack
	 */
	this.DS_friends = function(p) {
		var ds = new exports.DS_JSON(p);
		ds.queryParam = 'p';
		ds.rootKey = 'candidate';
		ds.net = '';
		ds.group = '';
		ds.page = XN.isUndefined(p.page) ? false : p.page;

		ds.param = XN.json.build(p.param || {});

		var limit =  XN.isUndefined(p.limit) ? 24 : p.limit;

		ds.query = function(name, callBack) {
			XN.log('start query');
			
			//只允许查询字母和汉字
			name = name.replace(/[^a-zA-Z\u0391-\uFFE5]/g, '');
			
			if (XN.string.isBlank(name) && this.group == '' && this.net == '') {
				callBack([]);
				return;
			}

			var p = [
				'{"init":false,',
				'"qkey":"' + this.qkey + '",',
				'"uid":true,',
				'"uname":true,',
				'"uhead":true,',
				'"limit":' + limit + ',',
				'"param":' + this.param + ',',
				'"query":"' +  name  + '",',
				'"group":"' + this.group + '",',
				'"net":"' + this.net + '",',
				'"page":"' + this.page + '"',
				'}'
			].join('');

			exports.DS_JSON.prototype.query.call(this, p, callBack);
		}
		return ds;
	};


	/**
	 * 从数组创建数据源
	 * <pre>
	 * 参数形式如下
	 *  {
	 *      data:a,//创建源的数组
	 *      searchKey:'name'//要搜索的字段
	 *  }
	 * </pre>
	 * @class DS_Array
	 * @constructor
	 * @param {Object} params
	 */

	/**
	 * 查询数组
	 * @method query
	 * @param {String} v 查询的字符串
	 * @param {Function} callBack
	 */
	this.DS_Array = function(p) {
		XN.$extend(this, p);
		this.init();
	};

	this.DS_Array.prototype = {
		DS_TYPE : 'array',
		data : null,
		searchKey : null,
		
		init : function() {
			var key = this.searchKey,
			index = this._index = [];
			
			XN.array.each(this.data, function(i, v) {
				index.push(v[key]);
			});
		},
		
		query : function(v, callBack) {
			callBack(this._search(v));
		},
		
		_search : function(v) {
			var keys = this._index,
			data = this.data,
			rt = [],
			reg = new RegExp('^' + v, 'i');
			XN.array.each(keys, function(i, v) {
				if (reg.test(v)) rt.push(data[i]);
			});
			return rt;
		}
	};

	/**
	 * xml格式的ajax数据源
	 * <pre>
	 * 参数形式如下: 
	 *  {
	 *      url:''//查询的url地址
	 *  }
	 * </pre>
	 * @class DS_XHR
	 * @constructor 
	 * @param {Object} params
	 */

	/**
	 * 查询数据源
	 * @method query
	 * @param {String} v
	 * @param {Function} callBack
	 */
	this.DS_XHR = function(p) {
		XN.$extend(this, p);
	};

	this.DS_XHR.prototype = {
		url : null,
		queryParam : 'query',
		_request : null,
		
		query : function(v, callBack) {
			var This = this;
			
			try {
				this._request.abort();
			} catch(e) {}
			
			function parseDS_XML(r) {
				r = r.responseXML;
				var rt = [];
				function getResult(r) {
					var tmp = {};
					XN.array.each(r.childNodes, function(i, v) {
						tmp[v.tagName.toLowerCase()] = v.firstChild.nodeValue;
					});
					return tmp;
				}
				try {
					var rs = r.getElementsByTagName('Result');
					XN.array.each(rs, function(i, v) {
						rt.push(getResult(v));
					});
				}
				catch(e) {
					rt = [];
				}
				callBack(rt);
			}
			
			this._request = new XN.net.xmlhttp({
				url : this.url,
				data : this.queryParam + '=' + encodeURIComponent(v),
				onSuccess : parseDS_XML
			});
		}
	};

});
/**
 * @namespace XN
 * @class browser
 * @static
 */
object.add('XN.browser', 'sys, XN', function(exports, sys, XN) {

	/**
	 * @property IE
	 * @type {Boolean}
	 */
	this.IE = !!(window.attachEvent && !window.opera);

	/**
	 * 增加IE9的判断
	 * 在用户的浏览器userAgent中有可能同时出现 MSIE 6.0/MSIE 7.0/MSIE 8.0，导致IE8被误认为是IE6
	 * 因此在浏览器判断时，先排他，再检测userAgent
	 *
	 * @modifier zhifu.wang
	 */

	/**
	 * @property IE9
	 * @type {Boolean}
	 */
	this.IE9 = navigator.userAgent.indexOf('MSIE 9.0') > -1;
	
	/**
	* @property IE8
	* @type {Boolean}
	*/
	this.IE8 = !this.IE9 && navigator.userAgent.indexOf('MSIE 8.0') > -1;	

	/**
	 * @property IE7
	 * @type {Boolean}
	 */
	this.IE7 = !this.IE9 && !this.IE8 && navigator.userAgent.indexOf('MSIE 7.0') > -1;

	/**
	 * @property IE6
	 * @type {Boolean}
	 */
	this.IE6 = !this.IE9 && !this.IE8 && !this.IE7 && navigator.userAgent.indexOf('MSIE 6.0') > -1;
	
	/**
	 * @property Opera
	 * @type {Boolean}
	 */
	this.Opera = !!window.opera,
	
	/**
	 * @property WebKit
	 * @type {Boolean}
	 */
	this.WebKit = navigator.userAgent.indexOf('AppleWebKit/') > -1;
	
	/**
	 * @property Gecko
	 * @type {Boolean}
	 */
	this.Gecko = navigator.userAgent.indexOf('Gecko') > -1 && navigator.userAgent.indexOf('KHTML') == -1;
	
	/**
	 * copy string to clipboard
	 * @param {String} str
	 */
	this.copy = function(o) {
		function onfail() {
			if (XN.isElement(o)) {
				o.select();
			}
		}
		
		var str;

		if (XN.isElement(o)) {
			str = o.value;
		} else {
			str = o;
		}

		var _do = sys.modules['XN.Do'];
		
		if (window.clipboardData && clipboardData.setData) {
			if (clipboardData.setData('text', str)) return true;
		} else { 
			if (_do) {
				_do.alert({
					message : '您的浏览器不支持脚本复制,请尝试手动复制',
					callBack : function() {
						onfail();
					}
				});
			} else {
				alert('您的浏览器不支持脚本复制,请尝试手动复制');
			}
			return false;
		}

		if (_do) {
			_do.alert({
				message : '您的浏览器设置不允许脚本访问剪切板',
				callBack : function() {
					onfail();
				}
			});
		} else {
			alert('您的浏览器设置不允许脚本访问剪切板');
		}

		return false;
	}
});

/**
 * @namespace XN
 * @class cookie
 * @static
 */
object.add('XN.cookie', 'XN', function(exports, XN) {

	/**
	 * get cookie
	 * @method get
	 * @param {String} name
	 */
	this.get = function(name) {
		var nameEQ = name + '=';
		var ca = document.cookie.split(';');
		for (var i=0; i < ca.length; i++) {
			var c = ca[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1, c.length);
			}
			if (c.indexOf(nameEQ) == 0) {
				return decodeURIComponent(c.substring(nameEQ.length, c.length));
			}
		}
		return null;
	}
	
	/**
	 * set Cookie
	 * @method set
	 * @param {String} name
	 * @param {String} value
	 * @param {Int} days
	 * @param {String} path
	 * @param {String} domain
	 * @param {Boolean} secure
	 */
	this.set = function(name, value, days, path, domain, secure) {
		var expires;
		if (XN.isNumber(days)) {
			var date = new Date();
			date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
			expires = date.toGMTString();
		} else if (XN.isString(days)) {
			expires = days;
		} else {
			expires = false;
		}
		
		document.cookie = name + '=' + encodeURIComponent(value) +
				(expires ? ';expires=' + expires  : '') +
				(path ? ';path=' + path : '') +
				(domain ? ';domain=' + domain : '') +
				(secure ? ';secure' : '');
	}
	
	/**
	 * delete Cookie
	 * @method del
	 * @param {String} name
	 * @param {String} path
	 * @param {String} domain
	 * @param {Boolean} secure
	 */
	this.del = function(name, path, domain, secure) {
		exports.set(name, '', -1, path, domain, secure);
	}
});
/**
 * @namespace XN
 * @class net
 * @static
 */
object.add('XN.net', 'XN, XN.form, XN.util, XN.event, XN.func, XN.browser, XN.element', function(exports, XN) {
	if(!window.__ajaxProxies) {
		window.__ajaxProxies = {};
	}

	/**
	 * send form by xmlhttp<br />
	 * the params is like {url:'',form:'',method:'',onSuccess:'',onError:''}
	 * @namespace XN.net 
	 * @method sendForm 
	 * @param {Object} params
	 * @return {XN.net.xmlhttp}
	 * @requires xn.form.js
	 */
	this.sendForm = function(params) {
		XN.log('send form');
		params.data = XN.form.serialize(params.form);
		return new exports.xmlhttp(params);
	};

	/**
	 * 发送一个统计，为避免垃圾回收导致不能发送请求，将img放到window的一个全局变量中
	 * @see http://hi.baidu.com/naivebaby/blog/item/91a5fb18dc95631434fa4137.html
	 */
	this.sendStats = function(url) {
		var n = "log_"+ (new Date()).getTime();
		var c = window[n] = new Image(); // 把new Image()赋给一个全局变量长期持有
		c.onload = (c.onerror=function() {window[n] = null;});
		c.src = url;
		c = null; // 释放局部变量c
	};

	/**
	 * 参数形式
	 * <pre>
	 * {
	 *  url:'',
	 *  data:'',
	 *  useCache:true,
	 *  method:'get',
	 *  onComplete:functoin,//请求完成回调
	 *  onSuccess:function,//请求成功回调
	 *  onError:''//请求失败回调
	 *  }
	 *
	 *  注意: 302重定向属于失败状态
	 *  
	 *  callBack = function(r)
	 *  {
	 *      if (r.status == 302)
	 *      {
	 *      }
	 *  }
	 *  
	 *  回调函数可以通过r.status判断是否重定向
	 *  </pre>
	 * @namespace XN.net
	 * @class xmlhttp
	 * @constructor
	 * @param {Object} params
	 */
	this.xmlhttp = function(params) {
		var This = this;
		
		if (!exports.cache)
			 exports.cache = new XN.util.cache();
		
		//patch for old version
		if (arguments.length > 1) {
			this.url = arguments[0] || null;
			this.data = arguments[1] || '';
			this.onSuccess = arguments[2];
			extendObject(this, arguments[3]);
			init(window);
			return this;
		}
		
		extendObject(this, params);

		var cache;
		
		if (this.useCache && (cache = exports.cache.get(this.url + encodeURIComponent(this.data)))) {
			this.transport = {};
			this.transport.responseText = cache;
			setTimeout(function() {
				This._onComplete();
				This._onSuccess();
			}, 0);
			return this;
		}
		
		function init(w) {
			This.transport = This.getTransport(w);
			return This.url && This.send(This.method);
		}

		var tmp = XN.element.$element('a');
		tmp.href = this.url;
			
		//请求Host和protocol
		var requestHost = tmp.hostname;
		var requestProtocol = tmp.protocol;

		if (/^http/.test(this.url) && location.hostname != requestHost) {
			if (window.__ajaxProxies[requestHost]) {
				//如果该域相应iframe仍在loading，则延迟直到onload时再init
				//避免同域请求在iframe onload之前再次向DOM插入重复src的iframe
				(function() {
					if (window.__ajaxProxies[requestHost].loaded) {
						init(window.__ajaxProxies[requestHost].contentWindow);
					} else {
						setTimeout(arguments.callee, 100);
					}
				})()
			} else {
				var iframe = XN.element.$element('iframe').hide();
				document.body.insertBefore(iframe, document.body.firstChild);
				var iframe_src = requestProtocol + '//' + requestHost + '/ajaxproxy.htm'; 
				if (requestHost.indexOf('notice.') != -1 || requestHost.indexOf('music.') != -1) {
					iframe_src = iframe_src + '?v=1';
				}
				iframe.src = iframe_src;
				//框架插入DOM，但未load完成
				window.__ajaxProxies[requestHost] = iframe; 
				window.__ajaxProxies[requestHost].loaded = false;
				XN.event.addEvent(iframe, 'load', function() {
					// Firefox3 的一个bug，当多个iframe同时加载时，有可能出现内容错乱的问题
					// https://bugzilla.mozilla.org/show_bug.cgi?id=388714
					// https://bugzilla.mozilla.org/show_bug.cgi?id=363840
					// 表现就是src和location.href地址不一样了，当遇到这种情况是，重新刷新下iframe的内容
					if (iframe.contentWindow.location.href !== iframe.src) {
						iframe.contentWindow.location.href = iframe.src;
					} else {
						try{
							init(iframe.contentWindow);
							//iframe load完成，修改状态属性
							window.__ajaxProxies[requestHost] = iframe;
							window.__ajaxProxies[requestHost].loaded = true;
						} catch(e) {}
					}

				});
			}
		} else
			init(window);
		return This;
	};

	this.xmlhttp.prototype = {
		url : null,
		data : '',
		onStart: new Function(),
		onSuccess : null,
		onFailure : null,
		onError : null,
		fillTo : null,
		method : 'post',
		asynchronous : true,
		transport : null,
		headers : null,
		iAmXmlhttp:true,
		useCache : false,
		requestToken : true,
		binary: false,
		formData:false,
		
		
		/**
		 * 取消当前请求
		 * @method abort
		 */		
		abort:function() {
			this.transport.abort();
		},

		send:function(method) {
			var _url;
			if (method == 'get' && this.data !== '') {
				_url = this.url + (/\?/.test(this.url) ? '&' : '?') + this.data;
			} else {
				_url = this.url;
			}
				
			this.transport.onreadystatechange = this.onStateChange.bind(this);
			this.transport.open(method, _url, this.asynchronous);
			//Chrome支持FormData对象以Ajax方式模拟form提交数据
			//反如果使用FormData则不能设置以下http头
			if (!this.formData) {
				this.transport.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
			}		
			
			if (this.headers !== null) {
				for (var i in this.headers) {
					this.transport.setRequestHeader(i ,this.headers[i]);
				}
			}
			//安全 阻止跨站提交
			var params  = null;
			if (method.toLowerCase() == 'post') {
				params = this.data;
				if(this.requestToken && XN.get_check) {
					params += (params ? '&' : '') + 'requestToken=' + XN.get_check;
				}
				if(this.requestToken && XN.get_check_x) {
					params += (params ? '&' : '') + '_rtk=' + XN.get_check_x;
				}
			}
			// null log listener
			// only IE && profile && get request && 十分之一
			try{
				if(window.event && document.body.id == 'profile' && method == 'get' && /(none|null)\b/.test(this.url) && XN.user.id % 10 == 0) {
					var temp = document.createElement('div');
					var obj = event.srcElement;
					temp.appendChild(obj);
					if(obj) {
						var params = {from:'profile', nodeHTML:temp.innerHTML};
						nullOrNoneLog(params);
					}
				}
			} catch(e){}

			// 找到null 或者 none 请求的LOG
			function nullOrNoneLog(data){
				var params = '';
				for(var i in data) {
    				params = params + '&' + i + '=' + encodeURIComponent(data[i]);
				}
				var logImg = new Image().src = 'http://123.125.44.44/r/?t=' + new Date().getTime() + params;
			} 
			

			//判断是否发送二进制数据流
			if(this.binary) {
				this.transport.sendAsBinary(params);
			} else {
				this.transport.send(params);
			}
		},
		
		_onSuccess : function(obj) {
			var transport = this.transport;
			if (this.fillTo !== null) {
				try{this.fillTo.stopLoading();}catch(e) {}
				this.fillTo.innerHTML = transport.responseText;
			}
			try {
				if (this.onSuccess) {
					this.onSuccess.call(null, transport);
				}
			} catch (e) {
				if (XN.DEBUG_MODE) {
					throw e;
				}
			}
		},
		
		_onComplete : function(obj) {
			var transport = this.transport;
			try {
				if (this.onComplete) {
					this.onComplete.call(null, transport);
				}
			} catch(e) {
				if (XN.DEBUG_MODE) {
					throw e;
				}
			}
		},

		onStateChange : function() {
			var transport = this.transport;
			if(transport.readyState == 1 && !this.hasRunStart) {
				this.onStart();
				this.hasRunStart = true;
			} else if (transport.readyState == 4) {
				if(transport.status == undefined || transport.status == 0 || (transport.status >= 200 && transport.status < 300)) {
					if (this.useCache) {
						exports.cache.add(this.url + encodeURIComponent(this.data), this.transport.responseText);
					}
					this._onSuccess();
				} else {
					(this.onError || this.onFailure || XN.func.empty).call(null, transport);
				}
				this._onComplete();
			}
		}
	};

	this.xmlhttp.prototype.getTransport = function(w) {
		if(w != window) {
			return w.getTransport();		
		} else if(XN.browser.IE) {
			try{
				return new ActiveXObject('Msxml2.XMLHTTP');
			} catch(e) {
				return new ActiveXObject('Microsoft.XMLHTTP');
			}
		}
		else {
			return new XMLHttpRequest();
		}
	};

	this.ajax = this.xmlhttp;

	XN.$extend(this.xmlhttp.prototype, {
		get : function(url, data, onSuccess, params) {
			this.url = url;
			this.data = data;
			this.onSuccess = onSuccess;
			XN.$extend(this, params);
			this.send('get');
		},
		
		post : function(url, data, onSuccess, params) {
			this.url = url;
			this.data = data;
			this.onSuccess = onSuccess;
			XN.$extend(this, params);
			this.send('post');		
		}
	});

	if (typeof Ajax == 'undefined') {
		Ajax = {};
		Ajax.Request = function(url, o) {
			var p = o.parameters;
			o['url'] = url;
			o['data'] = p;
			delete o.parameters;
			return new exports.xmlhttp(o);
		} 
	}
});
/**
 * @namespace XN
 * @class env
 * @static
 */
object.add('XN.env', function(exports) {

	this.shortSiteName = '人人';
	this.siteName = '人人网';
	this.domain = 'renren.com';
	//this.domain = window.location.hostname.split('.').reverse().slice(0, 2).reverse().join('.');

	/**
	 * @property domain
	 * @type {String}
	 * @default '' + XN.env.domain + ''
	 */
    this.domain_reg = this.domain.replace(/\./g,'\\.');
	
	/**
	 * @property staticRoot
	 * @type {String}
	 * @default 'http://s.xnimg.cn/'
	 */
	this.staticRoot = 'http://s.xnimg.cn/';
	
	this.CDNstaticRoot = 'http://a.xnimg.cn/';
	
	/**
	 * @property swfRoot
	 * @type {String}
	 * @default 'http://static.xiaonei.com'
	 */
	this.swfRoot = 'http://static.xiaonei.com/';
	
	/**
	 * @property wwwRoot
	 * @type {String}
	 * @default 'http://' + XN.env.domain + '/'
	 */
	this.wwwRoot = 'http://' + this.domain + '/';
	
});

/**
 * @namespace XN
 * @class event
 * @static
 */

object.add('XN.event', 'XN, XN.browser, XN.array, XN.element', function(exports, XN) {
	var browser = XN.browser;
	var allEvents = [];

	// 不记录event，所有addEvent直接返回
	this.ignoreEvent = false;

	/**
	 * @property logEvents
	 */
	this.logEvents = false;

	/**
	 * @method isCapsLockOn
	 * @param {Object} e the event object
	 * @return {Boolean}
	 */
	this.isCapsLockOn = function(e) {
		var c = e.keyCode || e.which;
		var s = e.shiftKey;
		if (((c >= 65 && c <= 90) && !s) || ((c >=97 && c <= 122) && s)) {
			return true;
		}
		return false;
	};
	
	/**
	 * get event src element
	 * @method element
	 * @param {Object} e the event object
	 * @return {HTMLElement}
	 */
	this.element = function(e) {
		var n = e.target || e.srcElement;
		return exports.resolveTextNode(n);
	};
	
	/**
	 * get related element of event as 'mouseover'
	 * @method relatedTarget
	 * @param {Object} e
	 * @return {HTMLElement}
	 */
	this.relatedTarget = function(e) {
		var t = e.relatedTarget;
		if (!t) {
			if (e.type == 'mouseout' || e.type == 'mouseleave') {
				t = e.toElement;
			}
			else if (e.type == 'mouseover') {
				t = e.fromElement;
			}
		}	
		return exports.resolveTextNode(t);
	};
	
	this.resolveTextNode = function(n) {
		try {
			if (n && 3 == n.nodeType) {
				return n.parentNode;
			}
		} catch(e) {}
		
		return n;
	};
	
	/**
	 * get mouse pointer pose x
	 * @method pointerX
	 * @param {Object} event
	 * @return {Int}
	 */
	this.pointerX = function(event) {
		return event.pageX || (event.clientX + (document.documentElement.scrollLeft || document.body.scrollLeft));
	};
	
	/**
	 * get mouse pointer pose y
	 * @method pointerY
	 * @param {Object} event
	 * @return {Int}
	 */
	this.pointerY = function(event) {
		return event.pageY || (event.clientY + (document.documentElement.scrollTop || document.body.scrollTop));
	};
	
	/**
	* 判断当前页面是否是标准模式
	*/
	this.isStrictMode = document.compatMode!="BackCompat";
	
	/**
	 * get page height
	 * @method pageHeight
	 * @return {Int}
	 */
	this.pageHeight = function() {
		return this.isStrictMode ? Math.max(document.documentElement.scrollHeight,document.documentElement.clientHeight) : Math.max(document.body.scrollHeight,document.body.clientHeight);
	};
	
	/**
	 * get page width
	 * @method pageWidth
	 * @return {Int}
	 */
	this.pageWidth = function() {
		return this.isStrictMode ? Math.max(document.documentElement.scrollWidth,document.documentElement.clientWidth) : Math.max(document.body.scrollWidth,document.body.clientWidth);
	};
	
	/**
	 * get inner width of window
	 * @method winWidth
	 * @return {Int}
	 */
	this.winWidth = function() {
		return this.isStrictMode ?  document.documentElement.clientWidth : document.body.clientWidth;
	};
	
	/**
	 * get inner height of window
	 * @method winHeight
	 * @return {Int}
	 */
	this.winHeight = function() {
		return this.isStrictMode ? document.documentElement.clientHeight : document.body.clientHeight;
	};
	
	/**
	 * get scrollTop of document
	 * @method scrollTop
	 * @return {Int}
	 */
	this.scrollTop = function() {
		if (XN.browser.WebKit) {
			return window.pageYOffset;
		}
		
		return this.isStrictMode ? document.documentElement.scrollTop : document.body.scrollTop;
	};
	
	/**
	 * get scrollLeft of document
	 * @method scrollLeft
	 * @return {Int}
	 */
	this.scrollLeft = function() {
		if (XN.browser.WebKit) {
			return window.pageXOffset;
		}

		return this.isStrictMode ? document.documentElement.scrollLeft : document.body.scrollLeft;
	};
	
	/**
	 * stop event bubble
	 * @method stop
	 * @param {Object} event
	 */
	this.stop = null;


	this.clearEvents = function() {
		for (var eventInfo, i = 0; eventInfo = allEvents[i]; i++) {
			exports.delEvent.apply(exports, eventInfo);
		}

		allEvents = [];
	};
	
	this.addEvent = function(el, name, func, cap) {
		if (exports.ignoreEvent) return;

		var els = [];
		el = XN.element.$(el);
		if (XN.isArray(el)) {
			els = el;
		} else {
			els.push(el);
		}
		if (els.length == 0) return el;
		XN.array.each(els, function(i, v) {
			if (exports.logEvents) allEvents.push([v, name, func, cap]);
			exports._addEvent(v, name, func, cap);
		});
		return el;
	};
	
	this.delEvent = function(el, name, func, cap) {
		var els = [];
		el = XN.element.$(el);
		if (XN.isArray(el)) {
			els = el;
		} else {
			els.push(el);
		}
		if (els.length == 0) {
			return el;
		}
		XN.array.each(els, function(i, v) {
			exports._delEvent(v, name, func, cap);
		}); 
		return el;
	};
	
	this._addEvent = null;
	
	this._delEvent = null;
	
	/**
	 * enable custom event for an object
	 * @param {Object} obj
	 * @return {Object}
	 */
	this.enableCustomEvent = function(obj) {
		XN.$extend(obj, {
			addEvent : function(type, func) {
				if(!this._customEventListeners) this._customEventListeners = {};
				var funcs = this._customEventListeners;
				if(XN.isUndefined(funcs[type])) {
					funcs[type] = [];
				}
				funcs[type].push(func);
				return this;
			},
			
			delEvent : function(type, func) {
				var funcs = this._customEventListeners[type];
				if (funcs) {
					for(var i = funcs.length - 1; i >= 0; i--) {
						if(funcs[i] == func) {
							funcs[i] = null;
							break;
						}
					}
				}
				return this;
			},
			
			fireEvent : function(type) {
				if(!this._customEventListeners || !this._customEventListeners[type]) {
					return;
				}
				var funcs = this._customEventListeners[type], ars = XN.array.build(arguments);
				ars.shift();
				for(var i = 0, j = funcs.length; i < j; i++) {
					if(funcs[i]) {
						try { 
                            funcs[i].apply(this, ars);
                        } catch(ox) {
                            if (XN.DEBUG_MODE) {
								throw ox;
							}
                        }
						
					}
				}
			}
		});
		
		return obj;
	};
	
	if (browser.IE) {
		this.stop = function(event) {
			event.returnValue = false;
			event.cancelBubble = true;			
		}
	} else {
		this.stop = function(event) {
			event.preventDefault();
			event.stopPropagation();		
		}
	}
	
	var ismouseleave = function(event, element) {
		var p = event.relatedTarget;
		while (p && p != element) {
			try { 
				p = p.parentNode; 
			} catch(error) { 
				p = element; 
			}
		}
		return p !== element;
	}
	
	if (window.attachEvent && !browser.Opera) {
		// 将window.event包装一下，使其拥有preventDefault等方法
		function wrapEvent(nativeEvent) {
			nativeEvent.stopPropagation = function() {
				this.cancelBubble = true;
			};
			nativeEvent.preventDefault = function() {
				this.returnValue = false;
			};
			return nativeEvent;
		}

		this._addEvent = function(element, name, func) {
            element = XN.element.$(element);
            if (name == 'input') 	name = 'propertychange';
			if (name == 'keypress') name = 'keydown';
			
			if (!element._eventListeners[name]) {
				element._eventListeners[name] = [];
			}

			var wrapperFunc = function() {
				var e = wrapEvent(window.event);
				func.call(element, e);
			}
			wrapperFunc.innerFunc = func;

			element._eventListeners[name].push(wrapperFunc);

			element.attachEvent('on' + name, wrapperFunc);
            return element;
		};
		
		this._delEvent =  function(element, name, func) {
            element = XN.element.$(element);
			if (name == 'input' ) 	name = 'propertychange';
			if (name == 'keypress') name = 'keydown';

			if (!element._eventListeners[name]) {
				return;
			}

			for (var i = 0, wrapperFunc; i < element._eventListeners[name].length; i++) {
				wrapperFunc = element._eventListeners[name][i];
				if (wrapperFunc.innerFunc === func) {
					break;
				}
			}

			element.detachEvent('on' + name, wrapperFunc);
            return element;
		};
	} else if (window.addEventListener) {
		
		/**
		 * add event for element
		 * @namespace XN.event
		 * @method addEvent
		 * @param {HTMLElement | String} element
		 * @param {String} name
		 * @param {Function} func
		 * @param {Boolean} useCapture
		 * @return {HTMLElement}
		 */
		this._addEvent = function(element, name, func, useCapture) {
			element = XN.element.$(element);
			if (name == 'mouseleave') {
				element.onmouseleave = function(e) {
                    e = e || window.event;
					if (ismouseleave(e, element) && func) {
						func.call(element, e);
					}
				};
				element.addEventListener('mouseout', element.onmouseleave, useCapture);
				return element;
			}
			if (name == 'keypress' && browser.WebKit) {
				name = 'keydown';
			}
			element.addEventListener(name, func, useCapture);
			return element;
		};
		
		/**
		 * del event 
		 * @method delEvent
		 * @param {HTMLElement | String} element
		 * @param {String} name
		 * @param {Function} func
		 * @param {Boolean} useCapture
		 * @return {HTMLElement}
		 */
		this._delEvent = function(element, name, func, useCapture) {
			element = XN.element.$(element);
			if (name == 'mouseleave') {
				element.removeEventListener('mouseout', element.onmouseleave, useCapture);
				return element;
			}
			if (name == 'keypress' && browser.WebKit) {
				name = 'keydown';
			}
			element.removeEventListener(name, func, useCapture);
			return element;
		};
	}
});

/**
 * @namespace XN
 * @class dom
 * @static
 */
object.define('XN.dom', 'dom, ua, XN, XN.event, XN.array, XN.browser, XN.element', function(require, exports) {
	require('XN.event');
	require('XN.array');
	require('XN.browser');
	require('XN.element');
	var dom = require('dom');
	var ua = require('ua');
	var XN = require('XN');

	var Event = XN.event;
	var array = XN.array;
	var browser = XN.browser;
	
	var shadowElement = null;
	
	function createShadow(opacity, zIndex) {
        opacity = opacity || 0.3;
        zIndex = zIndex || 2000;
		
        var el = XN.element.$element('div');
		
        shadowElement = el;
		
		el.style.position = 'absolute';
		el.style.top = 0;
		el.style.left = 0;
		el.style.background = '#000';
		el.style.zIndex = zIndex;
		el.style.opacity = opacity;
		el.style.filter = 'alpha(opacity=' + (opacity * 100) + ')';
		el.innerHTML = ['<iframe width="100%" height="100%" frameBorder="0" style="position:absolute;top:0;left:0;z-index:1;"></iframe>',
                        '<div style="position:absolute;top:0;left:0;width:100%;height:100%;background-color:#000000;z-index:2;height:expression(this.parentNode.offsetHeight);"></div>'].join('');
		
        function resize() {
		    el.hide();
            el.style.height = XN.event.pageHeight() + 'px';
		    el.style.width = XN.event.pageWidth() + 'px';
			el.show();					
        }
		
        resize();

        XN.event.addEvent(window, 'resize', function(e) {
			if (shadowElement && shadowElement.style.display != "none") {
                try {
                    resize();
				} catch(e) {}
            }
		});
		
		document.body.insertBefore(el, document.body.firstChild);
	}
	
	/**
	 * disable user interface
	 * @method disable
	 * @param {Float} opacity
	 */
	this.disable = function(opacity, zIndex) {
		if (!shadowElement) {
			createShadow(opacity, zIndex);
		}
		/*if (XN.browser.IE6)
		{
			document.getElementsByTagName("html")[0].style.overflow="hidden";
			document.body.style.overflow="hidden";
		}*/
	};
	
	/**
	 * enable user interface
	 * @method enable
	 */
	this.enable = function() {
		if (shadowElement) {
			/*if (XN.browser.IE6)
			{
				document.getElementsByTagName("html")[0].style.overflow="";
				document.body.style.overflow="";
			}*/

			shadowElement.remove();
			shadowElement = null;
		}
	};
	
	/**
	 * insert element after another
	 * @method insertAfter
	 * @param {HTMLElement} element
	 * @param {HTMLElement} targetElement
	 */
	this.insertAfter = function(element, targetElement) {
		element = XN.element.$(element);
		targetElement = XN.element.$(targetElement);
		
		var parent = targetElement.parentNode;
		if (parent.lastChild == targetElement) {
			parent.appendChild(element);
		} else {
			parent.insertBefore(element, targetElement.nextSibling);
		}
	};
	
	/**
	 * get elements by classname
	 * @param {String} className
	 * @param {HTMLElement | String} element
	 * @param {String} tagName
	 * @return {Array}
	 */
	this.getElementsByClassName = function(className, element, tagName) { 
		var c = (XN.element.$(element) || document).getElementsByTagName(tagName || '*') || document.all; 
		var elements = []; 
		var _exp = new RegExp("(^|\\s)" + className + "(\\s|$)");
		
		array.each(c, function(i, v) {
			if (_exp.test(v.className)) elements.push(v);
		});
		
		return elements; 
	};

	this.findFirstClass = function(element, className) {
		element = XN.element.$(element);
		var els = exports.getElementsByClassName(className, element);
		return XN.element.$(els[0]) || null;
	};

	this.ready = function(callback, async) {
		if (XN.isUndefined(async)) {
			async = false;
		}
		var func = async? function() {
			setTimeout(callback, 0);
		} : callback;

		dom.ready(func);
	};

	/**
	 * preload Image
	 * @method preloadImg
	 * @param {String | Array} src
	 */
	this.preloadImg = function(src) {
		src = XN.isArray(src) ? src : [src];
		array.each(src, function(i, v) {
			new Image().src = v;
		});
	};
	
	this.readyDo = this.ready;
	
	//this.ready(function() {
	//	$ = ge = getEl = xn_getEl;
	//});
});
/**
 * @namespace XN
 * @class element
 * @static
 */

object.add('XN.element', 'sys, XN, XN.browser, XN.env', function(exports, sys, XN) {
	var browser = XN.browser;

	//属性名称白名单，在将属性扩展到元素上时，去除$,$element,__name__,toString四个元素的扩展
	var _extends = ['clear','hover','scrollTo','visible','toggleClass','toggleText',
				   'hasClassName','addClass','delClass','show','hide','remove','setStyle','getStyle',
                   'addEvent','delEvent','_eventListeners','matchesSelector','getData','delegate','addChild',
                   'delChild','setContent','setHTML','getPosition','realLeft','realTop','appendHTML','html','parent',
                   'startLoading','stopLoading','eval_inner_JS','extend','setOpacity','findFirstClass'];
	var _effect = sys.modules['XN.effect'];

	// 将字符串转化成dom
	function getDom(str) {
		var tmp = document.createElement('div');
		tmp.style.display = 'none';
		document.body.appendChild(tmp);

		tmp.innerHTML = str;
		var dom = document.createElement('div');
		while (tmp.firstChild) dom.appendChild(tmp.firstChild);
		tmp.parentNode.removeChild(tmp);
		return dom;
	}

	// 判断是否需要使用getDom
	var t = document.createElement('div');
	t.innerHTML = '<TEST_TAG></TEST_TAG>';
	// IE 下无法获取到自定义的Element，其他浏览器会得到HTMLUnknownElement
	var needGetDom = t.firstChild === null;
	
	/**
	 * 清空元素的innerHTML
	 * @method clear
	 * @param {HTMLElement | String} element
	 * @return {HTMLElement}
	 */

	this.clear = function(element) {
		element = exports.$(element);
		element.innerHTML = '';
		return element;
	};

	/**
	 * simple hover
	 * @method hover
	 * @param {HTMLElement | String} element the element hover on
	 * @param {String} className hover class
	 * @param {HTMLElement | String} hover add class to
	 */
	this.hover = function(element, className, hover) {
		element = exports.$(element);
		hover =  hover ? exports.$(hover) : element;
		var _event = sys.modules['XN.event'];
		if(_event) {
			_event.addEvent(element, 'mouseover', function() {
				hover.addClass(className);
			}, false);
			
			_event.addEvent(element ,'mouseleave', function() {
				hover.delClass(className);
			}, false);
		} else {
			throw new Error("请先导入XN.event模块，再使用XN.event.addEvent");
		}
		
		return element;
	};
	
	/**
	 * scroll page to element
	 * @method scrollTo
	 * @param {HTMLElement} element
	 * @param {String} effect
	 */
	this.scrollTo = function(element,effect) {
		element = exports.$(element);
		// 无effect模块重置
		if (!_effect) effect = 'normal';
		switch(effect) {
			case 'slow':
			XN.effect.scrollTo(element);
			break;
			default:
			window.scrollTo(0,element.realTop());
			break;
		}
		return element;
	};
	
	/**
	 * check if an element is visible
	 * @method visible
	 * @param {HTMLElement | String} element
	 * @return {Boolean}
	 */
	this.visible = function(element) {
		element = exports.$(element);
		return element.style.display != 'none' && element.style.visibility != 'hidden';
	};
	
	/**
	 * 来回开关一个元素的某个样式
	 * <pre>
	 *  &lt;div onclick="$(this).toggleClass('expand');"&gt;&lt;/div&gt;
	 * </pre>
	 * @method toggleClass
	 * @param {HTMLElement | String} element
	 * @return {HTMLElement}
	 */
	this.toggleClass = function(element, className, className2)
	{
		if (XN.isUndefined(className2)) {
			if (exports.hasClassName(element, className)) {
				exports.delClass(element, className);
			} else {
				exports.addClass(element, className);
			}
		}
		else {
			if (exports.hasClassName(element, className)) {
				exports.delClass(element, className);
				exports.addClass(element, className2);
			} else {
				exports.addClass(element, className);
				exports.delClass(element, className2);
			}
		}
		return exports.$(element);
	};

	/**
	 * 切换一个元素的innerHTML 
	 * <pre>
	 *  &lt;div onclick="$(this).toggleText('1', '2');"&gt;&lt;/div&gt;
	 * </pre>
	 * @method toggleText
	 * @param {HTMLElement | String} element
	 * @param {HTMLElement | String} text1 
	 * @param {HTMLElement | String} text2 
	 * @return {HTMLElement}
	 */ 
	this.toggleText = function(element, text1, text2) {
		if (element.innerHTML == text1) {
			element.innerHTML = text2;
		} else {
			element.innerHTML = text1;
		}
	};

	/**
	 * check if an element has given className
	 * @method hasClassName
	 * @param {HTMLElement | String} element
	 * @param {String} className
	 * @return {Boolean}
	 */
	this.hasClassName = function(element, className) {
		return new RegExp('(^|\\s+)' + className + '(\\s+|$)').test(exports.$(element).className);
	};
		
	/**
	 * add classname to an element
	 * @method addClass
	 * @param {HTMLElement | String} element
	 * @param {String} className
	 * @return {HTMLElement}
	 */
	this.addClass = function(element, className) {
		element = exports.$(element);
		if (exports.hasClassName(element, className))return element;
		element.className += ' ' + className;
		return element;
	};
	
	/**
	 * del className from an element
	 * @method delClass
	 * @param {HTMLElement | String} element
	 * @param {String} className
	 * @return {HTMLElement}
	 */
	this.delClass = function(element, className) {
		element = exports.$(element);
		element.className = element.className.replace(new RegExp('(^|\\s+)' + className + '(\\s+|$)', 'g'), ' ');
		return element;
	};
	
	/**
	 * show an element
	 * @method show element
	 * @param {HTMLElement | String} element
	 * @param {String} effect
	 * @return {HTMLElement}
	 */
	this.show = function (element,effect) {
		element = exports.$(element);
		if(element.style.display != 'none')return;
		// 无effect模块重置
		if (!_effect || !effect) effect = 'normal';
		switch(effect) {
			case 'normal':
			element.style.display = '';
			break;
			case 'fade':
			XN.effect.fadeIn(element,function(e) {
				e.style.display = '';
			});
			break;
			case 'slide':
			XN.effect.slideOpen(element);
			break;
			case 'delay':
			setTimeout(function() {
				element.style.display = '';
			},2000);
			break;
		}
		return element;
	};
	
	/**
	 * hide an element
	 * @method hide
	 * @param {HTMLElement} element
	 * @param {String} effect
	 * @return {HTMLElement}
	 */
	this.hide = function (element,effect) {
		element = exports.$(element);
		if(element.style.display == 'none')return;
		// 无effect模块则重置
		if (!_effect || !effect) effect = 'normal';
		switch(effect) {
			case 'normal':
			element.style.display = 'none';
			break;
			case 'fade':
			XN.effect.fadeOut(element,function(e) {
				e.style.display = 'none';
			});
			break;
			case 'slide':
			XN.effect.slideClose(element);
			break;
			case 'delay':
			setTimeout(function() {
				element.style.display = 'none';
			},2000);
			break;
		}
		return element;
	};
	
	/**
	 * remove element from the DOM
	 * @method remove
	 * @param {HTMLElement | String} element
	 * @return {HTMLElement}
	 */
	this.remove = function(element)
	{
		var element = exports.$(element);
		element.parentNode.removeChild(element);
		return element;
	};
	
	/**
	 * set style for an element
	 * @method setStyle
	 * @param {HTMLElement | String} element
	 * @param {String} style
	 * @return {HTMLElement}
	 */
	this.setStyle = function(element, style)
	{
		var element = exports.$(element);
		element.style.cssText += ';' + style;
		return element;
	};
	
	/**
	 * get style by style name
	 * @param {HTMLElement | String} element
	 * @param {String} name
	 * @return {String}
	 */
	this.getStyle = function(element, style) {
		element = exports.$(element);
		
		style = style == 'float' ? 'cssFloat' : style;
		
		var value = element.style[style];
		
		if (!value) {
			var css = document.defaultView.getComputedStyle(element, null);
			value = css ? css[style] : null;
		}
		
		if (style == 'opacity') return value ? parseFloat(value) : 1.0;
		
		return value == 'auto' ? null : value;
	};
	
	/**
	 * @method addEvent
	 * @return {HTMLElement}
	 * @see XN.event.addEvent
	 */
	this.addEvent = function() {
		var _event = sys.modules['XN.event'];
		if(_event) {
			_event.addEvent.apply(null, arguments);
		} else {
			throw new Error("请先导入XN.event模块，再使用XN.event.addEvent");
		}
		return arguments[0];
	};
	
	/**
	 * @method delEvent
	 * @return {HTMLElement}
	 * @see XN.event.delEvent
	 */
	this.delEvent = function() {
		var _event = sys.modules['XN.event'];
		if(_event) {
			_event.delEvent.apply(null, arguments);
		} else {
			throw new Error("请先导入XN.event模块，再使用XN.event.delEvent");
		}
		return arguments[0];
	};
	
	this._eventListeners = {};
	
	/**
	 * @method matchesSelector
	 */
	this.matchesSelector = function(element, selector) {
		return Sizzle.matches(selector, [element]).length > 0;
	};

	/**
	 * @method getData
	 * @param data name
	 * @return data value
	 */
	this.getData = function(element, name) {
		return element.getAttribute('data-' + name);
	};

	/**
	 * @method delegate
	 * @param  
	 */
	this.delegate = function(element, selector, type, callback) {
		exports.$(element).addEvent(type, function(e) {
			var ele = exports.$(e.target || e.srcElement);
			do {
				if (ele && ele.matchesSelector(selector)) callback.call(ele, e);
			} while(ele = exports.$(ele.parentNode));
		});
	};
	
	/**
	 * add Child node to element
	 * @method addChild
	 * @param {HTMLElement | String} father
	 * @param {HTMLElement | String | XN.ui.element | XN.net.xmlhttp} child
	 * @return {HTMLElement}
	 */
	this.addChild = function(father, child) {
		father = exports.$(father);
		
		if (XN.isString(child) || XN.isNumber(child)) {
			var element = String(child).charAt(0) == '#' ? Sizzle(child)[0] : child;
			if(XN.isString(child) || XN.isNumber(child)) {
				father.innerHTML += element;
			} else {
				father.appendChild(element);
			}
		} else if (XN.isElement(child)) {
			father.appendChild(child);
		} else if(child.iAmUIelement) {
			father.appendChild(exports.$(child.frame));
		} else if(child.iAmXmlhttp) {
			child.fillTo = father;
			father.startLoading();
		}
		return father;
	};
	
	/**
	 * 
	 * @method delChild
	 * @param {HTMLElement | String} father
	 * @param {HTMLElement | String | XN.ui.element } child
	 * @return {HTMLElement}
	 */
	this.delChild = function(father, child) {
		child = exports.$(child);
		child.remove();
		return exports.$(father);
	};
	
	/**
	 * @method setContent
	 * @param {HTMLElement | String} element
	 * @param {HTMLElement | String | XN.ui.element | XN.net.xmlhttp} c
	 * @return {HTMLElement}
	 */
	this.setContent = function(element, c) {
		element = exports.$(element);
		element.innerHTML = '';
		element.addChild(c);
		return element;
	};

	/**
	 * 通过字符串设置此元素的内容
	 * 为兼容HTML5标签，IE下无法直接使用innerHTML
	 * @param str html代码
	 */
	this.setHTML = function(element, str) {
		if (needGetDom) {
			element.innerHTML = '';
			var nodes = getDom(str);
			while (nodes.firstChild) element.appendChild(nodes.firstChild);
		} else {
			element.innerHTML = str;
		}
	};

	this.getPosition = function(element, parentE) {
		parentE = exports.$(parentE) || document.body;
		element = exports.$(element);
		var rl = 0;
		var rt = 0;
		var p = element;
		//fix ie7 未指明的错误
		try {
			while (p && p != parentE) {
				rl += p.offsetLeft;
				rt += p.offsetTop;
				p = p.offsetParent;
			}
		} catch(e) {}
		return { 'left' : rl, 'top' : rt };
	};
	
	/**
	 * 获取元素的绝对左边距
	 * @method realLeft
	 * @param {HTMLElement | String} element
	 * @return {Int}
	 */
	this.realLeft = function(element, p) {
		return exports.getPosition(element, p || null).left;
	};
	
	/**
	 * 获取元素的绝对上边距
	 * @method realTop
	 * @param {HTMLElement | String} element
	 * @return {Int}
	 */
	this.realTop = function(element, p) {
		return exports.getPosition(element, p || null).top;
	};
	
	/**
	 * 直接append HTML
	 * @method appendHTML
	 * @param {String} str
	 * @return {HTMLElement}
	 */
	this.appendHTML = function(element, str, getElements) {
		element = exports.$(element);
		var f = document.createDocumentFragment();
		var t = exports.$element('div');
		t.innerHTML = str;
		while(t.firstChild)
		{
			f.appendChild(t.firstChild);
		}
		var tmp = XN.array.build(f.childNodes);
		element.appendChild(f);
		if (getElements) return tmp;
		return element;
	};

	/**
	 * 通过字符串设置此元素的内容
	 * 为兼容HTML5标签，IE下无法直接使用innerHTML
	 * @param str html代码
	 */
	this.html = function(element, str) {
		element.innerHTML = str;
	};

	/**
	 * 查找符合selector的父元素
	 * @param selector css选择符
	 */
	this.parent = function(element, selector) {
		while (element) {
			element = exports.$(element.parentNode);
			if (element.matchesSelector(selector)) return element;
		}
	};

	/**
	 * 在一个div内显示loading的图标,用于ajax动态加载数据
	 * 
	 * <pre>
	 * $('message').startLoading('loading...');
	 * </pre>
	 * @method startLoading
	 * @param {HTMLElement | String} element
	 * @param {String} msg loading时的提示信息
	 * @return {HTMLElement}
	 */
	this.startLoading = function(element, msg) {
		element = exports.$(element);
		element.innerHTML = '<center><img src=\"' + XN.env.staticRoot + 'img/indicator.gif\" />' + (msg || '加载中...') + '</center>';
		return element;
	};
	
	this.stopLoading = function(element) {
		element = exports.$(element);
		return element;
	};
	
	/**
	 * eval js in innerHTML
	 * @method eval_inner_JS
	 * @param {String | HTMLElement} el
	 */
	this.eval_inner_JS = function(el) {
		var js = exports.$(el).getElementsByTagName('script');
		XN.array.each(js, function(i, s) {
			if (s.src) {
				XN.loadFile(s.src);
			} else {
				var inner_js = '__inner_js_out_put = [];\n';
				inner_js += s.innerHTML.replace(/document\.write/g, '__inner_js_out_put.push');
				eval(inner_js);
				if (__inner_js_out_put.length !== 0) {
					var tmp = document.createDocumentFragment();
					exports.$(tmp).appendHTML(__inner_js_out_put.join(''));
					s.parentNode.insertBefore(tmp, s);
				}
			}
		});
	};

	var sign = {};
	
	this.extend = function(element) {
		if (element._extended) {
			return element;
		}
		var cache = exports.extend.cache;
		for (var i=0, m, len=_extends.length; i<len; i++) {
			m = _extends[i];
			if (exports[m] != null && !(m in element)) {
				element[m] = cache.findOrStore(exports[m]);
			}
		}
		element._extended = sign;
		return element;
	};
	
	this.extend.cache = {
	  findOrStore : function(value) {
	  	return this[value] = this[value] || function() {
	  		return value.apply(null, [this].concat(XN.array.build(arguments)));
		};
	  }		
	};

	if(browser.IE) {
		this.getStyle = function(element, style) {
		    element = exports.$(element);
		    style = (style == 'float' || style == 'cssFloat') ? 'styleFloat' : style;
		    var value = element.style[style];
		    if (!value && element.currentStyle) value = element.currentStyle[style];
		
		    if (style == 'opacity') {
				if (value = (element.getStyle('filter') || '').match(/alpha\(opacity=(.*)\)/)) {
					if (value[1]) {
						return parseFloat(value[1]) / 100;
					}
				}
				return 1.0;
		    }
		
		    if (value == 'auto') {
				if ((style == 'width' || style == 'height') && (element.getStyle('display') != 'none')) {
					return element['offset'+ (style == 'width' ? 'Width' : 'Height')] + 'px';
				}
				return null;
		    }
		    return value;			
		}
	}

    /**
     * 设置元素透明度
     * <pre>
     *  XN.element.setOpacity(el, 0.3);
     *  or
     *  $(el).setOpactiy(0.3);
     * </pre>
     * @method setOpacity
     * @param {Float} opacity
     * @return {HTMLElement}
     */
    if (document.addEventListener) {
        this.setOpacity = function(element, opacity) {
            element = exports.$(element);
            element.style.opacity = opacity;
            return element;
        };
    } else {
        this.setOpacity = function(element, opacity) {
            element = exports.$(element);
            element.style.zoom = 1;
            element.style.filter = 'Alpha(opacity=' + Math.ceil(opacity * 100) + ')';
            return element;            
        };
    }
	
	/**
	 * create an DOM element
	 * @method $element
	 * @param {String} tagName
	 * @return {HTMLElement}
	 */
	this.$element = function (tag){
		return exports.$(document.createElement(tag));
	}

	/**
	 * short cut for document.getElementById
	 * @method $
	 * @param {String} id
	 * @return {HTMLElement}
	 */
	this.$ = function (id){
		var element;
		if(id == null)
			element = null;
		else if (XN.isString(id) || XN.isNumber(id))
			element = Sizzle('#' + id)[0];
		else
			element = id;
		if(element) 
			exports.extend(element);
		return element || null;
	};
});
/**
 * @namespace XN
 * @class template
 * @static
 */
object.add('XN.template', 'XN.env', function(exports, XN) {
	/**
	 * @namespace XN.template
	 * @method mediaPlayer
	 * @param {Object} o
	 * @return {String}
	 */
	this.smediaPlayer = function( o ) {
		return [ 
		'<object classid="CLSID:22d6f312-b0f6-11d0-94ab-0080c74c7e95" width="' + (o.width || '352') + '" height="' + (o.height || '70') + '" >\n',
		'<param name="autostart" value="' + (o.autostart || '1')+'" >\n',
		'<param name="showstatusbar" value="' + (o.showstatusbar || '1')+ '">\n',
		'<param name="filename" value="'+ o.filename +'">\n',
		'<embed type="application/x-oleobject" codebase="http://activex.microsoft.com/activex/controls/mplayer/en/nsmp2inf.cab#Version=5,1,52,701" ',
		'flename="mp"',
		'autostart="' + (o.autostart || '1') + '" showstatusbar="' + (o.showstatusbar || '1') + '" ',
		'src="' + o.filename + '" width="' + (o.width || '352') + '" height="' + (o.height || '70') + '"></embed>'
		].join( '' );
	};
	
	/**
	 * @namespace XN.template
	 * @method  flashPlayer
	 * @param {Object} o
	 * @return {String}
	 */
	this.flashPlayer = function( o ) {
		return '<embed allowScriptAccess="' + (o.allowScriptAccess || 'none') + '" src="' + XN.env.staticRoot + '/swf/player.swf?url=' + encodeURIComponent(o.filename) + '&Rwid=' + (o.width || '450') + '&Autoplay=' + (o.autostart || '1')+ '" wmode="' + (o.wmode || 'transparent') +'" loop="false" menu="false" quality="high" scale="noscale" salign="lt" bgcolor="#ffffff" width="' + (o.width || '450') + '" height="' + (o.height || '30') + '" align="middle"  allowFullScreen="false" type="application/x-shockwave-flash" pluginspage="http://www.macromedia.com/go/getflashplayer" />';
	};
	
	/**
	 * @namespace XN.template
	 * @method flash
	 * @param {Object} o
	 * @return {String}
	 */
	this.flash = function( o ) {
		return '&nbsp;<embed src="' + o.filename + '" type="application/x-shockwave-flash" ' +
		'width="' + (o.width || '320') + '" height="' + (o.height || '240') + '" allowFullScreen="true" wmode="' + (o.wmode || 'transparent') + '" allowNetworking="' + (o.allowNetworking || 'all') + '" allowScriptAccess="' + (o.allowScriptAccess || 'sameDomain') + '"></embed>';
	};
	
});
/**
 *  表单相关
 * @module form
 */

object.add('XN.form', 'sys, XN, XN.event, XN.json, XN.array, XN.element, XN.string, XN.env', function(exports, sys, XN) {

	/**
	 * 将json字符串解析并将值填入表单
	 * @method fiilWidthJSON
	 * @param {HTMLElement | String} form
	 * @param {String} json
	 */
	this.fillWithJSON = function(form, json) {
		form = XN.element.$(form);
		exports.fillWithArray(form, XN.json.parse(json));
	};


	/**
	 * 将数组填入表单
	 * @method fillWidthArray
	 * @param {HTMLElement | String} form
	 * @param {Array} a
	 */
	this.fillWithArray = function(form, a) {
		form = XN.element.$(form);
		for (var p in a) {
			exports.Element.setValue(p, a[p], form);
		}
	};

	/**
	 * 设定一个表单元素的值
	 * @method setValue
	 * @param {HTMLElement | String} element
	 * @param {Any} value
	 * @return {HTMLElement}
	 */
	this.setValue = function(element, value) {
		return exports.Element.setValue(element, value);
	};


	/**
	 * 获取一个表单元素的值
	 * @method getValue
	 * @param {HTMLElement | String} element
	 * @return {String | Boolean}
	 */
	this.getValue = function(element) {
		return exports.Element.getValue(element);
	};

	/**
	 * 序列化一个form
	 * @method serialize
	 * @param {HTMLElement | String} form
	 * @param {String} type 序列化的形式可以是'string','array','hash'
	 * @return {String | Array | Hash}
	 */
	this.serialize = function(form, type) {
		return exports.serializeElements(exports.getElements(form), type || 'string');
	};

	this.serializeElements = function(elements, type ,encode) {
		
		type = type || 'array';

		if(XN.isUndefined(encode)) {
			encode = false;
		}

		var data = [],_key,_value;

		XN.array.each(elements, function(i, v) {
			if (!v.disabled && v.name) {
				_key = v.name;
				_value = encode ? encodeURIComponent(exports.Element.getValue(v)) : exports.Element.getValue(v);
				
				if (_value !== null) {
					if (_key in data) {
						if (!XN.isArray(data[_key])) { data[_key] = [data[_key]]; }
						data[_key].push(_value);
					} else {
						data[_key] = _value;
					}
				}
			}        
		});
		
		if (type == 'array') {
			return data;
		} else if (type == 'string') {
			return XN.array.toQueryString(data);
		} else if(type == 'hash') {
			var tmp = {};
			for (var p in data) {
				if (!XN.isFunction(data[p])) {
					tmp[p] = data[p];
				}
			}
			return tmp;
		}
		//return options.hash ? data : Object.toQueryString(data);
	};


	this.getElements = function(form) {
		form = XN.element.$(form);
		var elements = [];
		var all = form.getElementsByTagName('*');
		
		XN.array.each(all, function(i, v) {
			if (!XN.isUndefined(exports.Element.Serializers[v.tagName.toLowerCase()])) {
				elements.push(v);
			}        
		});

		return elements;
	};


	this.Element = {

		getValue : function(element) {
			element = XN.element.$(element);
			var method = element.tagName.toLowerCase();
			return exports.Element.Serializers[method](element);
		},

		setValue: function(element, value,form) {
			if (form)  {
				element = form[element];
				if ((XN.isElement(element) && element.tagName.toLowerCase() == 'select')) {
					exports.Element.Serializers['select'](element, value);
				} else if(XN.isElement(element)) {
					exports.Element.Serializers[element.tagName.toLowerCase()](element, value);
				} else if(element[0]) {
					var method = element[0].tagName.toLowerCase();
					for (var i = 0,j = element.length;i < j;i++) {
						exports.Element.Serializers[method](element[i], (value[i] || value || ''));
					}
				}
				return element;
			} else {
				element = XN.element.$(element);
				var method = element.tagName.toLowerCase();
				exports.Element.Serializers[method](element, value);
				return element;
			}
		}
	};

	this.Element.Serializers = {
		input : function(element, value) {
			switch (element.type.toLowerCase()) {
				case 'checkbox':
				case 'radio':
					return exports.Element.Serializers.inputSelector(element, value);
				default:
					return exports.Element.Serializers.textarea(element, value);
			}
		},
		
		inputSelector : function(element, value) {
			if (XN.isUndefined(value))  {
				return element.checked ? element.value : null;
			} else {
				element.checked = !!value;
			}
		},

		textarea : function(element, value) {
			if (XN.isUndefined(value)) { 
				return element.value; 
			} else { 
				element.value = value; 
			}
		},

		select : function(element, index) {
			if (XN.isUndefined(index)) {
				return this[element.type == 'select-one' ? 'selectOne' : 'selectMany'](element);
			} else {
				var opt, value, single = !XN.isArray(index);
				for (var i = 0, length = element.length; i < length; i++) {
					opt = element.options[i];
					value = this.optionValue(opt);
					if (single) {
						if (value == index) {
							opt.selected = true;
							return;
						}
					} else { 
						opt.selected = XN.array.include(index ,value);
					}
				}
			}
		},

		selectOne : function(element) {
			var index = element.selectedIndex;
			return index >= 0 ? this.optionValue(element.options[index]) : null;
		},

		selectMany : function(element) {
			var values = [], length = element.length;
			if (!length) {return null;}

			for (var i = 0; i < length; i++) {
				var opt = element.options[i];
				if (opt.selected) {
					values.push(this.optionValue(opt));
				}
			}
			return values;
		},

		optionValue : function(opt) {
			return opt.value || opt.text;
		}
	};

	/*
	 * patch for old version
	 */
	$F = function(id, type) {
		var el = XN.element.$(id);
		if (el.tagName.toLowerCase() == 'form') {
			return exports.serialize(el, type);
		} else {
			return exports.getValue(el);
		}
	};
	/*
	 * patch end
	 */

	this._helper = function(el) {
		el = XN.element.$(el);
		try {
			if (el._helper) return el._helper;
		} catch(e) {
			console.log(arguments.callee.caller);
		}
		el._helper = this;
		this.element = el;
	};

	this._helper.prototype = {	
		maxSize : 9999,
		limit : function(max, cut) {
			var This = this;
			this.maxLength = max;
			if (XN.isUndefined(cut)) {
				cut = true; 
			}
			this._limit_cut = cut;
			if (this._limit) {
				return this;
			}
			this._limit = true;

			var el = this.element;

			XN.event.addEvent(el, 'focus', check);
			XN.event.addEvent(el, 'keyup', check);

			function check() {
				This.limitCheck();
			}

			return this;
		},
		
		limitCheck : function() {
			var This = this;
			var el = this.element;
			//fix bug for ie 可能会闪屏
			setTimeout(function() {
				var v = el.value;
				if (v.length > This.maxLength) {
					if (This._limit_cut) el.value = v.substr(0, This.maxLength);
					This.fireEvent('overmaxLength');
				} else {
					This.fireEvent('normalLength');
				}
				
				This.fireEvent('checkover');
			}, 0);
		},

		count : function(show, showMax) {
			if (this._count) {
				return this;
			}
			this._count = true;

			var This = this, show = XN.element.$(show);
			if (XN.isUndefined(showMax)) {
				showMax = true;
			}
			if (!this.maxLength) {
				showMax = false;
			}

			var el = this.element;
			
			this.addEvent('overmaxLength', function() {
				show.addClass('full');
			});

			this.addEvent('normalLength', function() {
				show.delClass('full');
			});

			this.addEvent('checkover', update);

			function update() {
				show.innerHTML = el.value.length  + (showMax ? '/' + This.maxLength : '');
			}

			return this;
		},

		countSize : function(show, max, showMax) {
			return this.limit(max).count(show, showMax);
		},

		getRealValue : function() {
			var el = this.element;
			if (el.value == this._defaultValue || el.value == el.getAttribute('placeholder')) {
				return '';
			}
			return el.value;
		},

		reloadDefaultValue : function() {
			this.element.value = this._defaultValue;
			this.element.style.color = '#888';
		},

		defaultValue : function(v) {
			var This = this;
			var el = this.element;
			v = v || el.value;

			if (!XN.isUndefined(this._defaultValue) && el.value == this._defaultValue) {
				el.value = v;
			}
			
			this._defaultValue = v;
			
			if (this._default) {
				return this;
			}
			this._default = true;
			
			if (document.activeElement !== el) {
				el.value = v;
			}
			
			el.style.color = '#888';

			XN.event.addEvent(el, 'focus', function() {
				if (el.value == This._defaultValue) {
					el.value = '';
					el.style.color = '#333';
				}
			});

			XN.event.addEvent(el, 'blur', function() {
				if (el.value == '') {
					el.value = This._defaultValue;
					el.style.color = '#888';
				}
			});

			return this;
		},
		
		focus : function(position) {
			var el = this.element;
			if (XN.isUndefined(position)) {
				position = el.value.length;
			}
			try{
			if (el.setSelectionRange) {
				el.focus();
				el.setSelectionRange(el.value.length, position);
			} else if(el.createTextRange) {
				var range = el.createTextRange();
				range.moveStart('character', position);
				range.collapse(true);
				range.select();
				el.focus();
			} else {
				el.focus();
			}
			}catch(e){}

			return this;
		},

		onEnter : function(callBack) {
			var el = this.element;
			var isTextArea = el.tagName.toLowerCase() == 'textarea';
			
			XN.event.addEvent(el, 'keydown', function(e) {
				e = e || window.event;
				if(e.keyCode == 13) {
					if(isTextArea && !e.ctrlKey) {
						return false;
					}
					XN.event.stop(e);
					callBack(el);
					return false;
				}
			}, false);

			return this;
		},
		
		onEsc : function(callBack) {
			var el = this.element;
			XN.event.addEvent(el, 'keydown', function(e) {
				e = e || window.event;
				if (e.keyCode == 27) {
					XN.event.stop(e);
					callBack(el);
					return false;
				}
			}, false);
			return this;		
		},

		autoResize : function(min, max) {
			var This = this, el = this.element, type;
			this.minSize = min || this.minSize;
			this.maxSize = max || this.maxSize;
			//this.type = type;
			
			if (el.tagName.toLowerCase() == 'textarea') {
				this.resizeType = 'height';
			} else {
				this.resizeType = 'width';
			}

			if (!exports.inputShadow) {
				var d = XN.element.$element('div');
				d.setStyle('position:absolute;left:-99999px;top:-99999px');
				document.body.appendChild(d);
				exports.inputShadow = d;
			}

			this.shadow = exports.inputShadow;
			
			//延时等待渲染
			setTimeout(function() {
				if(min) {
					return;
				}
				This.minSize = type == 'width' ? el.offsetWidth : el.offsetHeight;
			}, 10);

			el.style.overflow = 'hidden';
			
			/*if (XN.browser.IE)
			{
				el.style.fontSize = '12px';
				el.style.fontFamily = "'lucida grande',tahoma,verdana,arial,simsun,sans-serif";
			}*/

			XN.event.addEvent(el, 'focus', function() {
				This.timer = setInterval(This._resize.bind(This), 200);
			});

			XN.event.addEvent(el, 'blur', function() {
				clearInterval(This.timer);
				This.timer = null;
			});
			
			return this;
		},
		
		_resize : function() {
			var el = this.element, sh = this.shadow, oh, type = this.resizeType;
			sh.style.fontSize = el.getStyle('fontSize');
			var fs = parseInt(el.getStyle('fontSize'), 0);
			sh.style.fontFamily = el.getStyle('fontFamily');
			(type == 'width') ? sh.style.height = el.offsetHeight : sh.style.width = el.offsetWidth;
			sh.innerHTML = XN.string.escapeHTML(el.value).replace(/\r\n/mg,'<br>').replace(/\r/mg,'<br>').replace(/\n/mg,'<br>');
			
			(type == 'width') ? oh = sh.offsetWidth : oh = sh.offsetHeight + fs + 3;
			if (oh > this.minSize && oh < this.maxSize) {
				el.style[type] = oh + 'px';
			} else if(oh < this.minSize) {
				el.style[type] = this.minSize + 'px';
			} else if(oh > this.maxSize) {
				el.style[type] = this.maxSize + 'px';
			}
		},

		cursorPosition : function() {
			var textBox = this.element;
			var start = 0, end = 0;
			
			try{ 
			
			/* typeof(textBox.selectionStart) == 'number' 这句有时候会报错：
			uncaught exception: [Exception... "Component returned failure code: 0x80004005 (NS_ERROR_FAILURE) [nsIDOMHTMLTextAreaElement.selectionStart]"  nsresult: "0x80004005 (NS_ERROR_FAILURE)"  location: "JS frame :: http://s.xnimg.cn/a26900/n/core/base-all.js :: <TOP_LEVEL> :: line 6587"  data: no]
http://s.xnimg.cn/a27011/n/apps/home/compatible/home.js
Line 3678，
			还没查清楚原因 2011.10.25 传业注 */
			
			if (typeof(textBox.selectionStart) == 'number') {
				start = textBox.selectionStart;
				end = textBox.selectionEnd;
			} else if (document.selection) {
				var range = document.selection.createRange();
				if (range.parentElement() == textBox) {
					var range_all = document.body.createTextRange();
					range_all.moveToElementText(textBox);
					
					for (start=0; range_all.compareEndPoints('StartToStart', range) < 0; start++) {
						range_all.moveStart('character', 1);
					}
					
					for (var i = 0; i <= start; i ++) {
						if (textBox.value.charAt(i) == '\n') {
							start++;
						}
					}
					
					var range_all = document.body.createTextRange();
					
					range_all.moveToElementText(textBox);
					
					for (end = 0; range_all.compareEndPoints('StartToEnd', range) < 0; end ++) {
						range_all.moveStart('character', 1);
					}
					
					for (var i = 0; i <= end; i ++) {
						if (textBox.value.charAt(i) == '\n') {
							end ++;
						}
					}
				}
			}
			
			} catch(e){}
			
			return {"start": start, "end": end, "item": [start, end]};
		}
	};

	this._helper.prototype.setDefaultValue = this._helper.prototype.defaultValue;
	XN.event.enableCustomEvent(this._helper.prototype);

	this.help = function(id) {
		return new exports._helper(id);
	}

	//patch for old method
	this.inputHelper = this.textAreaHelper = this.help;
	$CursorPosition = function(el) { 
		return exports.help(el).cursorPosition(); 
	};

	// Compatible
	this.userInfoAutoComplete = function(id,type) {
		var _ui = sys.modules['XN.ui'];
		if (_ui) {
			return _ui.userInfoAutoComplete(id, type);
		} else {
			throw new Error('请在use中导入XN.ui模块，才可使用XN.form下的此方法');
		}
	};

});
/**
 * effect
 * @class effect
 * @namespace XN
 * @static
 */
object.add('XN.effect', 'XN.func, XN.element, XN.event', function(exports, XN) {

	this.fadeIn = function(element, callBack) {
		if(element.fadetimer) {
			return;
		}
		callBack = callBack || XN.func.empty;
		var op = 0;
		element.setOpacity(0);
		element.style.display = '';
		element.fadetimer = setInterval(function() {
            XN.element.setOpacity(element,(op += 0.20));
            if(op >= 1) {
                clearInterval(element.fadetimer);
                element.fadetimer = null;
                callBack(element);
            }
		},60);
	};
	
	this.fadeOut = function(element, callBack) {
		if(element.fadetimer) {
			return;
		}
		callBack = callBack || XN.func.empty; 
		var op =1;
		element.setOpacity(1);
		element.fadetimer = setInterval(function() {
            XN.element.setOpacity(element,(op -= 0.20));
            if(op <= 0) {
                clearInterval(element.fadetimer);
                element.fadetimer = null;
                callBack(element);
                element.setOpacity(1);
            }
        },60);		
	};
	
	this.gradient = function(element, r, g, b, callBack) {
		if(element.gradientTimer) {
			return;
		}
		callBack = callBack || XN.func.empty;
		element.style.backgroundColor = '#fff';
		element.style.backgroundColor = 'rgb(' + r + ',' + g + ',' + b + ')';
		element.gradientTimer = setInterval(function() {
			b += 10;
			element.style.backgroundColor = 'rgb(' + r + ',' + g + ',' + (b >255 ? 255 : b) + ')';
			if(b > 255) {
				clearInterval(element.gradientTimer);
				element.gradientTimer = null;
				callBack(element);
			}
		},60);
	};
	
	this.slideOpen = function(element) {
		if(element.slidetimer) {
			return;
		}
		if(!element.slideHeight) {
			var _position = element.getStyle('position');
			element.setStyle('position:absolute;left:-99999px;top:-99999px;');
			element.show();
			element.slideHeight = element.offsetHeight;
			element.hide();
			element.setStyle('position:' + _position + ';left:auto;top:auto;');
		}
		var eh = element.slideHeight,h = 0;
		var step = parseInt(eh / 10);
		element.style.height = '0px';
		element.style.display = '';
		element.style.overflow = 'hidden';
		element.slidetimer = setInterval(function() {
			element.style.height = (h += step) + 'px';
			if(h >= eh) {
				clearInterval(element.slidetimer);
				element.slidetimer = null;
				element.style.height = eh;
				element.style.overflow = element.slideOverflow;
			}
		},50);
	};
	
	this.slideClose = function(element) {
		if(element.slidetimer) {
			return;
		}
		var eh = element.offsetHeight,h = eh;
		element.slideHeight = eh;
		element.slideOverflow = element.getStyle('overflow');
		element.style.overflow = 'hidden';
		var step = parseInt(eh / 10);
		element.slidetimer = setInterval(function() {
			element.style.height = (h -= step) + 'px';
			if(h <= 0) {
				clearInterval(element.slidetimer);
				element.slidetimer = null;
				element.style.display = 'none';
				element.style.height = eh;
				element.style.overflow = element.slideOverflow;
			}
		},50);
	};
	
	this.scrollTo = function(element, speed, callBack) {
		if(element.scrolltimer) {
			return;
		}
		speed = speed || 10;
		callBack = callBack || XN.func.empty;
		var d = element.realTop();
		var i = XN.event.winHeight();
		var h = document.body.scrollHeight;
		var a = XN.event.scrollTop();;
		var offsetTop = null;
		if(d > a) {
			if(d + element.offsetHeight < i + a)return;
			element.scrolltimer = setInterval(function() {
				a += Math.ceil((d-a) / speed) || 1;
				window.scrollTo(0,a);
			  	if(a == d) {
					clearInterval(element.scrolltimer);
					element.scrolltimer = null;
				}
			},10);
		} else {
			element.scrolltimer = setInterval(function() {
				a += Math.ceil((d-a) / speed) || -1;
				window.scrollTo(0,a);
			  	if(a == d) {
					clearInterval(element.scrolltimer);
					element.scrolltimer = null;
				}
			},10);
		}
	};
	
	/**
	 * Motion - 动画组件
	 *
	 * @author  mingcheng<i.feelinglucky@gmail.com>
	 * @since   2009-01-26
	 * @link    http://www.gracecode.com/
	 * @version $Id: motion.js 217 2009-04-06 03:49:08Z i.feelinglucky $
	 *
	 * @change
	 *     [+]new feature  [*]improvement  [!]change  [x]bug fix
	 *
	 * [*] 2009-04-05
	 *      优化对象接口
	 *
	 * [*] 2009-04-05
	 *      优化 customEvent；增强动画函数判断，使其支持自定义函数
	 *
	 * [*] 2009-03-30
	 *      增加 customEvent 函数，优化逻辑
	 *
	 * [!] 2009-02-01
	 *      将 setTimeout 改成了 setInterval ，详见 http://ejohn.org/blog/how-javascript-timers-work/
	 *
	 * [*] 2009-01-27
	 *      调整接口，优化代码
	 *
	 * [+] 2009-01-26
	 *      最初版，完成基本功能
	 */
	(function(scope) {
		/**
		 * Easing Equations
		 *
		 * @see http://developer.yahoo.com/yui/animation/
		 * @see http://www.robertpenner.com/profmx
		 * @see http://hikejun.com/demo/yui-base/yui_2x_animation.html
		 */
		var Tween = {
			linear: function (t, b, c, d) {
				return c*t/d + b;
			},

			easeIn: function (t, b, c, d) {
				return c*(t/=d)*t + b;
			},

			easeOut: function (t, b, c, d) {
				return -c *(t/=d)*(t-2) + b;
			},

			easeBoth: function (t, b, c, d) {
				if ((t/=d/2) < 1) {
					return c/2*t*t + b;
				}
				return -c/2 * ((--t)*(t-2) - 1) + b;
			},
			
			easeInStrong: function (t, b, c, d) {
				return c*(t/=d)*t*t*t + b;
			},
			
			easeOutStrong: function (t, b, c, d) {
				return -c * ((t=t/d-1)*t*t*t - 1) + b;
			},
			
			easeBothStrong: function (t, b, c, d) {
				if ((t/=d/2) < 1) {
					return c/2*t*t*t*t + b;
				}
				return -c/2 * ((t-=2)*t*t*t - 2) + b;
			},

			elasticIn: function (t, b, c, d, a, p) {
				if (t === 0) { 
					return b; 
				}
				if ((t /= d) == 1) {
					return b+c; 
				}
				if (!p) {
					p=d*0.3; 
				}
				if (!a || a < Math.abs(c)) {
					a = c; 
					var s = p/4;
				} else {
					var s = p/(2*Math.PI) * Math.asin (c/a);
				}
				return -(a*Math.pow(2,10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p)) + b;
			},

			elasticOut: function (t, b, c, d, a, p) {
				if (t === 0) {
					return b;
				}
				if ((t /= d) == 1) {
					return b+c;
				}
				if (!p) {
					p=d*0.3;
				}
				if (!a || a < Math.abs(c)) {
					a = c;
					var s = p / 4;
				} else {
					var s = p/(2*Math.PI) * Math.asin (c/a);
				}
				return a*Math.pow(2,-10*t) * Math.sin((t*d-s)*(2*Math.PI)/p) + c + b;
			},
			
			elasticBoth: function (t, b, c, d, a, p) {
				if (t === 0) {
					return b;
				}
				if ((t /= d/2) == 2) {
					return b+c;
				}
				if (!p) {
					p = d*(0.3*1.5);
				}
				if (!a || a < Math.abs(c)) {
					a = c; 
					var s = p/4;
				}
				else {
					var s = p/(2*Math.PI) * Math.asin (c/a);
				}
				if (t < 1) {
					return - 0.5*(a*Math.pow(2,10*(t-=1)) * 
							Math.sin((t*d-s)*(2*Math.PI)/p)) + b;
				}
				return a*Math.pow(2,-10*(t-=1)) * 
						Math.sin((t*d-s)*(2*Math.PI)/p)*0.5 + c + b;
			},

			backIn: function (t, b, c, d, s) {
				if (typeof s == 'undefined') {
				   s = 1.70158;
				}
				return c*(t/=d)*t*((s+1)*t - s) + b;
			},

			backOut: function (t, b, c, d, s) {
				if (typeof s == 'undefined') {
					s = 1.70158;
				}
				return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
			},
			
			backBoth: function (t, b, c, d, s) {
				if (typeof s == 'undefined') {
					s = 1.70158; 
				}
				if ((t /= d/2) < 1) {
					return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
				}
				return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
			},

			bounceIn: function (t, b, c, d) {
				return c - Tween['bounceOut'](d-t, 0, c, d) + b;
			},
			
			bounceOut: function (t, b, c, d) {
				if ((t/=d) < (1/2.75)) {
					return c*(7.5625*t*t) + b;
				} else if (t < (2/2.75)) {
					return c*(7.5625*(t-=(1.5/2.75))*t + 0.75) + b;
				} else if (t < (2.5/2.75)) {
					return c*(7.5625*(t-=(2.25/2.75))*t + 0.9375) + b;
				}
				return c*(7.5625*(t-=(2.625/2.75))*t + 0.984375) + b;
			},
			
			bounceBoth: function (t, b, c, d) {
				if (t < d/2) {
					return Tween['bounceIn'](t*2, 0, c, d) * 0.5 + b;
				}
				return Tween['bounceOut'](t*2-d, 0, c, d) * 0.5 + c*0.5 + b;
			} /* ,

			// extra, form http://hikejun.com/demo/yui-base/yui_2x_animation.html
			easeInQuad: function (t, b, c, d) {
				return c*(t/=d)*t + b;
			},

			easeOutQuad: function (t, b, c, d) {
				return -c *(t/=d)*(t-2) + b;
			},

			easeInOutQuad: function (t, b, c, d) {
				if ((t/=d/2) < 1) return c/2*t*t + b;
				return -c/2 * ((--t)*(t-2) - 1) + b;
			},

			easeInCubic: function (t, b, c, d) {
				return c*(t/=d)*t*t + b;
			},

			easeOutCubic: function (t, b, c, d) {
				return c*((t=t/d-1)*t*t + 1) + b;
			},

			easeInOutCubic: function (t, b, c, d) {
				if ((t/=d/2) < 1) return c/2*t*t*t + b;
				return c/2*((t-=2)*t*t + 2) + b;
			},

			easeInQuart: function (t, b, c, d) {
				return c*(t/=d)*t*t*t + b;
			},

			easeOutQuart: function (t, b, c, d) {
				return -c * ((t=t/d-1)*t*t*t - 1) + b;
			},

			easeInOutQuart: function (t, b, c, d) {
				if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
				return -c/2 * ((t-=2)*t*t*t - 2) + b;
			},

			easeInQuint: function (t, b, c, d) {
				return c*(t/=d)*t*t*t*t + b;
			},

			easeOutQuint: function (t, b, c, d) {
				return c*((t=t/d-1)*t*t*t*t + 1) + b;
			},

			easeInOutQuint: function (t, b, c, d) {
				if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
				return c/2*((t-=2)*t*t*t*t + 2) + b;
			},

			easeInSine: function (t, b, c, d) {
				return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
			},

			easeOutSine: function (t, b, c, d) {
				return c * Math.sin(t/d * (Math.PI/2)) + b;
			},

			easeInOutSine: function (t, b, c, d) {
				return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
			},

			easeInExpo: function (t, b, c, d) {
				return (t===0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
			},

			easeOutExpo: function (t, b, c, d) {
				return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
			},

			easeInOutExpo: function (t, b, c, d) {
				if (t===0) return b;
				if (t==d) return b+c;
				if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
				return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
			},

			easeInCirc: function (t, b, c, d) {
				return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
			},

			easeOutCirc: function (t, b, c, d) {
				return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
			},

			easeInOutCirc: function (t, b, c, d) {
				if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
				return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
			},

			easeInElastic: function (t, b, c, d) {
				var s=1.70158;var p=0;var a=c;
				if (t===0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*0.3;
				if (a < Math.abs(c)) { a=c; var s=p/4; }
				else var s = p/(2*Math.PI) * Math.asin (c/a);
				return -(a*Math.pow(2,10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p)) + b;
			},

			easeOutElastic: function (t, b, c, d) {
				var s=1.70158;var p=0;var a=c;
				if (t===0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*0.3;
				if (a < Math.abs(c)) { a=c; var s=p/4; }
				else var s = p/(2*Math.PI) * Math.asin (c/a);
				return a*Math.pow(2,-10*t) * Math.sin((t*d-s)*(2*Math.PI)/p) + c + b;
			},

			easeInOutElastic: function (t, b, c, d) {
				var s=1.70158;var p=0;var a=c;
				if (t===0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(0.3*1.5);
				if (a < Math.abs(c)) { a=c; var s=p/4; }
				else var s = p/(2*Math.PI) * Math.asin (c/a);
				if (t < 1) return -0.5*(a*Math.pow(2,10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p)) + b;
				return a*Math.pow(2,-10*(t-=1)) * Math.sin((t*d-s)*(2*Math.PI)/p)*0.5 + c + b;
			},

			easeInBack: function (t, b, c, d, s) {
				if (s == undefined) s = 1.70158;
				return c*(t/=d)*t*((s+1)*t - s) + b;
			},

			easeOutBack: function (t, b, c, d, s) {
				if (s == undefined) s = 1.70158;
				return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
			},

			easeInOutBack: function (t, b, c, d, s) {
				if (s == undefined) s = 1.70158; 
				if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
				return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
			},

			easeInBounce: function (t, b, c, d) {
				return c - Tween['easeOutBounce'](d-t, 0, c, d) + b;
			},

			easeOutBounce: function (t, b, c, d) {
				if ((t/=d) < (1/2.75)) {
					return c*(7.5625*t*t) + b;
				} else if (t < (2/2.75)) {
					return c*(7.5625*(t-=(1.5/2.75))*t + 0.75) + b;
				} else if (t < (2.5/2.75)) {
					return c*(7.5625*(t-=(2.25/2.75))*t + 0.9375) + b;
				} else {
					return c*(7.5625*(t-=(2.625/2.75))*t + 0.984375) + b;
				}
			},

			easeInOutBounce: function (t, b, c, d) {
				if (t < d/2) return Tween['easeInBounce'](t*2, 0, c, d) * 0.5 + b;
				return Tween['easeOutBounce'](t*2-d, 0, c, d) * 0.5 + c*0.5 + b;
			}
			*/
		};

		// 动画行进中
		var _Tweening = function() {
			// 动画进行时的回调
			customEvent(this.onTweening, this);

			if (this.current >= this.frames) {
				this.stop();
				customEvent(this.onComplete, this);
				this.tweening = false;
				return;
			}

			this.current++;
		};

		/**
		 * 自定义事件
		 * 
		 * @params {Function} 事件回调
		 * @params {Object} 作用域
		 */
		var customEvent = function(func, scope) {
			var args = Array.prototype.slice.call(arguments);
				args = args.slice(2);
			if (typeof func == 'function') {
				try {
					return func.apply(scope || this, args);
				} catch (e) {
					scope.errors = scope.errors || [];
					scope.errors.push(e);
				}
			}
		};

		/**
		 * 动画组件
		 *
		 * @params {String} 动画类型（方程式）
		 * @params {Number} 过程动画时间
		 */
		scope.Motion = function(tween, duration) {
			this.duration = duration || 1000;
			this.tween = tween || 'linear';
		};

		// 返回动画公式
		scope.Motion.getTweens = function() {return Tween};

		// 原型继承
		scope.Motion.prototype = {
			// 初始化
			init: function() {
				customEvent(this.onInit, this);

				// 默认 35 FPS
				this.fps = this.fps || 35;

				// 计算帧数
				this.frames = Math.ceil((this.duration/1000)*this.fps);
				if (this.frames < 1) this.frames = 1;

				// 确定动画函数，便于计算当前位置
				var f = ('function' == typeof this.tween) ? this.tween : Tween[this.tween] || Tween['linear'];
				this.equation = function(from, to) {
					return f((this.current/this.frames)*this.duration, from, to - from, this.duration);
				};
				this.current = this.tweening = 1;
			},

			//  开始动画
			start: function() {
				this.init();
				customEvent(this.onStart, this);
				var _self = this, d = this.duration / this.frames;
				this.timer = setInterval(function() {_Tweening.call(_self);}, d);
			},

			// 停止动画
			stop: function() {
				if (this.timer) {
					clearInterval(this.timer);
				}
				this.tweening = false;
			}
		};
	})(exports);

});
/**
 * @namespace XN  
 * @class ui
 * @static
 */
object.add('XN.ui', 'XN, XN.array, XN.element, XN.event, XN.browser, XN.util, XN.dom, XN.func, XN.string, XN.env, XN.net, XN.json, XN.form, XN.datasource', function(exports, XN) {

	(function() {
		/**
		 * @namespace XN.ui
		 * @class element
		 * @static
		 */		
		exports.element = {
			
			/**
			 *  the  frame element
			 *  @property frame
			 *  @type {HTMLElement}
			 */
			frame : null,
			
			/**
			 * @property iAmUIelement
			 * @protected
			 * @type {Boolean}
			 * @default true
			 */
			iAmUIelement : true
			
		};

		/**
		 * @method show
		 * @see XN.element.show
		 */
		
		/**
		 * @method hide
		 * @see XN.element.hide
		 */
		
		/**
		 * @method remove
		 * @see XN.element.remove
		 */
		
		/**
		 * @method addClass
		 * @see XN.element.addClass
		 */
		
		/**
		 * @method deClass
		 * @see XN.element.delClass
		 */		
		XN.array.each(['addClass', 'delClass', 'show', 'hide', 'remove'], function(i, v) {
			exports.element[v] = function() {
				XN.element[v].apply(null, [this.frame].concat(XN.array.build(arguments)));
			}
		});

		/**
		 * @namespace XN.ui
		 * @class container
		 * @static
		 */		
		exports.container = {
			
			/**
			 * @property container
			 * @type {HTMLElement}
			 */
			container : null
		};
		
		/**
		 * @method addChild
		 * @see XN.element.addChild
		 */
		
		/**
		 * @method delChild
		 * @see XN.element.deChild
		 */
		
		/**
		 * @method setContent
		 * @see XN.element.setContent
		 */		
		XN.array.each(['addChild', 'delChild', 'setContent'], function(i, v) {
			exports.container[v] = function() {
				XN.element[v].apply(null, [this.container].concat(XN.array.build(arguments)));
			}
		});
		
		XN.$extend(exports.container, exports.element);
		
	})();


	this.Element = this.element;
	this.Content = this.container;

	(function(ns) {
		var UI = exports;
		var addEvent = XN.event.addEvent;
		var DEBUG = true;
		
		function log(s) {
			if (DEBUG) XN.log(XN.isString(s) ? 'xn.ui.button:' + s : s);
		}

		/**
		 * create a button
		 * @namespace XN.ui
		 * @class button
		 * @constructor
		 * @param  {Object} params The intial Attribute.
		 * @extends XN.ui.element
		 */		
		ns.button = function(params) {
			XN.$extend(this, params);
			this.init();
		};

		ns.button.prototype = XN.$extend({}, UI.Element);
		
		/**
		 * the title of the button
		 * @property text
		 * @type String
		 */		
		ns.button.prototype.text = null;
		
		/**
		 *	the className of the button
		 * @property className
		 * @type String
		 * @default 'input-submit'
		 */
		ns.button.prototype.className = '';
		
		/**
		 *  the disable class of the button
		 *  @property disableClassName
		 *  @type String
		 *  @default 'gray'
		 */		
		ns.button.prototype.disableClassName = 'gray';
		
		
		/**
		 * init
		 * @private
		 */		
		ns.button.prototype.init = function() {
			var This = this;

			var el;

			if (this.getConfig('el')) {
				el = XN.element.$(this.getConfig('el'));
			} else {
				el = XN.element.$element('input');
			}
			
			this.frame = el;
			el.type = 'button';
			this.addClass('input-submit');	
			this.addClass(this.getConfig('className'));
			this.setText(this.getConfig('text'));
			
			addEvent(el, 'click', function() {
				if (This.onclick) This.onclick();
			}, false);		
		};
		
		/**
		 * get user config
		 * @param {String} key
		 * @method getConfig
		 * @return {Any}
		 */		
		ns.button.prototype.getConfig = function(key) {
			if (key == 'el') return this.id;
			return this[key];
		};
		
		/**
		 * get dom element of the button
		 * @method getEl 
		 * @return {HTMLElement}
		 */		
		ns.button.prototype.getEl = function() {
			return this.frame;
		};
		/**
		 * set title of the button
		 * @method setText 
		 * @param {String} text
		 */		
		ns.button.prototype.setText = function(text) {
			this.text = text;
			this.getEl().value = text;
		};
		
		/**
		 * disable the button
		 * @method disable
		 */		
		ns.button.prototype.disable = function() {
			var el = this.getEl();
			el.blur();
			el.disabled = true;
			el.addClass(this.getConfig('disableClassName'));
		};

		/**
		 *  enable the button
		 *	@method enable
		 */		
		ns.button.prototype.enable = function() {
			var el = this.getEl();
			el.disabled = false;
			el.delClass(this.getConfig('disableClassName'));
		};

		/**
		 *  focus on the button
		 *  @method focus
		 */				
		ns.button.prototype.focus = function() {
			this.getEl().focus();
		};
		
		/**
		 *  make the button blur
		 *  @method blur
		 */
		ns.button.prototype.blur = function() {
			this.getEl().blur();
		};

	})(this);
	
	(function() {
		var rl = 'realLeft',rt = 'realTop',ow = 'offsetWidth',oh = 'offsetHeight';
		exports.fixPositionMethods = {
			'1-1':function(f,el,x,y,p) {
				f.style.left = x + el[rl]() - p[rl]() + 'px';
				f.style.top = y + el[rt]() - p[rt]() + 'px';
			},
			'1-2':function(f,el,x,y,p) {
				f.style.left = x + el[rl]() - p[rl]() - f[ow] + 'px';
				f.style.top = y + el[rt]() - p[rt]()  + 'px';
			},
			'1-3':function(f,el,x,y,p) {
				f.style.left = x + el[rl]() - p[rl]() - f[ow] + 'px';
				f.style.top = y + el[rt]() - p[rt]() - f[oh] + 'px';
			},
			'1-4':function(f,el,x,y,p) {
				f.style.left = x + el[rl]() - p[rl]() + 'px';
				f.style.top = y + el[rt]() - p[rt]()  - f[oh] + 'px';
			},
			'2-1':function(f,el,x,y,p) {
				f.style.left = x + el[rl]() - p[rl]() + el[ow] + 'px';
				f.style.top = y + el[rt]() - p[rt]()  + 'px';
			},
			'2-2':function(f,el,x,y,p) {
				f.style.left = x + el[rl]() - p[rl]() + el[ow] - f[ow] + 'px';
				f.style.top = y + el[rt]() - p[rt]() + 'px';
			},
			'2-3':function(f,el,x,y,p) {
				f.style.left = x + el[rl]() - p[rl]() + el[ow] - f[ow] + 'px';
				f.style.top = y + el[rt]() - p[rt]()  - f[oh] + 'px';
			},
			'2-4':function(f,el,x,y,p) {
				f.style.left = x + el[rl]() - p[rl]() + el[ow] + 'px';
				f.style.top = y + el[rt]() - p[rt]()  - f[oh] + 'px';
			},
			'3-1':function(f,el,x,y,p) {
				f.style.left = x + el[rl]() - p[rl]() + el[ow] + 'px';
				f.style.top = y + el[rt]() - p[rt]() + el[oh] + 'px';
			},
			'3-2':function(f,el,x,y,p) {
				f.style.left = x + el[rl]() - p[rl]() + el[ow] - f[ow] + 'px';
				f.style.top = y + el[rt]() + el[oh] + 'px';
			},
			'3-3':function(f,el,x,y,p) {
				f.style.left = x + el[rl]() - p[rl]() + el[ow] - f[ow] + 'px';
				f.style.top = y + el[rt]() - p[rt]() + el[oh] - f[oh] + 'px';
			},
			'3-4':function(f,el,x,y,p) {
				f.style.left = x + el[rl]() - p[rl]() + el[ow] + 'px';
				f.style.top = y + el[rt]() - p[rt]() + el[oh] - f[oh] + 'px';
			},
			'4-1':function(f,el,x,y,p) {
				f.style.left = x + el[rl]() - p[rl]() + 'px';
				f.style.top = y + el[rt]() - p[rt]() + el[oh] + 'px';
			},
			'4-2':function(f,el,x,y,p) {
				f.style.left = x + el[rl]() - p[rl]() - f[ow] + 'px';
				f.style.top = y + el[rt]() - p[rt]() + el[oh] + 'px';
			},
			'4-3':function(f,el,x,y,p) {
				f.style.left = x + el[rl]() - p[rl]() - f[ow] + 'px';
				f.style.top = y + el[rt]() - p[rt]() + el[oh] - f[oh] + 'px';
			},
			'4-4':function(f,el,x,y,p) {
				f.style.left = x + el[rl]() - p[rl]() + 'px';
				f.style.top = y + el[rt]() - p[rt]() + el[oh] - f[oh] + 'px';
			}
		};	
	})();

	/**
	 * create fix position element
	 * @namespace XN.ui
	 * @class fixPositionElement
	 * @constructor
	 * @param {Object} params
	 * @extends XN.ui.container
	 */
	this.fixPositionElement = function(params) {
		var This = this;
		
		this.config = {
			tagName : 'div',
			useIframeInIE6 : true
		};
		
		XN.$extend(this.config, params);
		
		var f,x,y;

		if (this.getConfig('id')) {
			this.frame = f = XN.element.$(this.getConfig('id'));
			x = f.realLeft();
			y = f.realTop();
		} else if (this.getConfig('tagName')) {
			this.frame = this.container = f = XN.element.$element(this.getConfig('tagName'));
		} else {
			return;
		}

		this.container = XN.element.$element('div');
		this.frame.appendChild(this.container);
		
		XN.array.each(['alignWith', 'alignType', 'offsetX', 'offsetY', 'alignParent'], function(i, v) {
			This[v] = This.getConfig(v) || This[v];
		});
		
		XN.element.setStyle(f, 'position:absolute;z-index:10001;left:-9999px;top:-9999px');

		if(!XN.element.$(this.alignParent)) {
			this.alignParent = XN.element.$(document.body);
		}
		
		XN.element.$(this.alignParent).appendChild(this.frame);
		
		if ((XN.browser.IE6 && this.getConfig('useIframeInIE6')) || this.getConfig('addIframe')) {
			var iframe;
			this._iframe = iframe = XN.element.$element('iframe');
			iframe.frameBorder = 0;
			iframe.scrolling = 'no';
			iframe.setStyle('position:absolute;border:0px;left:0px;top:0px;z-index:-1;');
			if (XN.browser.Gecko) iframe.setAttribute('style', 'position:absolute;border:0px;left:0px;top:0px;z-index:-1;');
			//fix 防止对话框高度改动时露出空白的iframe
			if (XN.browser.IE) iframe.style.filter = 'progid:DXImageTransform.Microsoft.Alpha(style=0,opacity=0)';
			this.frame.appendChild(iframe);	
		}
		
		if (XN.element.visible(f)) this.show();
		
		f.style.display = 'block';
	};

	this.fixPositionElement.prototype = XN.$extend({}, this.container);

	XN.$extend(this.fixPositionElement.prototype, {
		
		/**
		 * the element align with
		 * @property alignWith
		 * @type {HTMLElement | String}
		 */		
		alignWith : null,
		
		/**
		 * @property alignType
		 * @type {String}
		 */		
		alignType : '4-1',
		
		/**
		 * @property offsetX
		 * @type {Int}
		 * @default 0
		 */
		offsetX : 0,
		
		/**
		 * @property offsetY 
		 * @type {Int}
		 * @default 0
		 */		
		offsetY : 0,
		
		/**
		 * @property alignParent
		 * @type {HTMLElement | String}
		 * @default 'dropmenuHolder'
		 */		
		alignParent : 'dropmenuHolder',
		
		left : null,
		top : null,

		_isShow : false,

		getConfig : function(key) {
			return this.config[key];
		},
		
		/**
		 * set offset x
		 * @method setOffsetX
		 * @param {Int} x
		 * @return {Object} this
		 */		
		setOffsetX : function(x) {
			this.offsetX = x;
			this.refresh();
			return this;
		},
		
		/**
		 * set offset y
		 * @method setOffestY
		 * @param {Int} y
		 * @return {Object} this
		 */		
		setOffsetY : function(y) {
			this.offsetY = y;
			this.refresh();
			return this;
		},
		
		/**
		 * @method setAlignType
		 * @param {String} t
		 * @return {Object} this
		 */		
		setAlignType : function(t) {
			this.alignType = t;
			this.refresh();
			return this;
		},
		
		/**
		 * @method setAlignParent
		 * @param {HTMLElement | String} p
		 * @return {Object} this
		 */		
		setAlignParent : function(p) {
			this.alignParent = p;
			XN.element.$(this.alignParent).appendChild(this.frame);
			this.refresh();
			return this;
		},
		
		/**
		 * @method refresh
		 * @return {Object} this
		 */		
		refresh : function() {
			if (this.visible()) {
				this.show();
			} else {
				this.hide();
			}
			return this;
		},
		
		/**
		 * @method visible
		 * @return {Boolean}
		 */		
		visible : function() {
			return this._isShow;
		},
		
		/**
		 * @method show
		 * @return {Object} this
		 */
		show : function() {
			this._isShow = true;
			
			this.frame.show();
			
			if (this.alignWith) {
				this._moveToElement(this.alignWith);
			} else {
				var x = this.left === null ? parseInt(((XN.element.$(this.alignParent).offsetWidth -  this.frame.offsetWidth) / 2), 10) : this.left;
				var y = this.top === null ? XN.event.scrollTop() + 200 : this.top;
				this._moveToPosition(x, y);
			}
			
			if(this._iframe) {
				//fix bug for ie6
				try {
					this._iframe.style.height = this.frame.offsetHeight - 2 + 'px';
					this._iframe.style.width = this.frame.offsetWidth + 'px';
				} catch(e) {}
			}

			return this;
		},
		
		/**
		 * @method hide
		 * @return {Object} this
		 */		
		hide : function() {
			this._isShow = false;
			var f = this.frame;
			//this.left = f.offsetLeft;
			//this.top = f.offsetTop;
			f.style.left = '-9999px';
			f.style.top = '-9999px';
			return this;
		},
		
		/**
		 * @method moveTo
		 * @param {HTMLElement | String | Int} x
		 * @param {Int} y
		 * @return {Object} this
		 */		
		moveTo : function(x, y) {
			if (!x && !y) return;
			if (XN.isNumber(x)) {
				this.left = x;
				this.alignWith = null;
			} else if (XN.isString(x) || XN.isElement(x)) {
				this.alignWith = XN.element.$(x);
			}
			
			if (XN.isNumber(y)) {
				this.top = y;
				this.alignWith = null;
			}
			
			this.refresh();
			
			return this;
		},
		
		/**
		 * @method setX
		 * @param {Int} x
		 * @return {Object} this
		 */		
		setX : function(x) {
			this.moveTo(x);
			return this;
		},
		
		/**
		 * @method setY
		 * @param {Int} y
		 * @return {Object} this
		 */		
		setY : function(y) {
			this.moveTo(null, y);
			return this;
		},

		/**
		 * @method setIndex
		 * @param {Int} i
		 * @return {Object} this
		 */			
		setIndex : function(i) {
			this.frame.style.zIndex = i;
			return this;
		},
		
		_moveToElement : function(el) {
			exports.fixPositionMethods[this.alignType](
				this.frame, XN.element.$(el), this.offsetX, this.offsetY, XN.element.$(this.alignParent)
			);
		},
		
		_moveToPosition : function(x, y) {
			if (x) {
				this.frame.style.left = x + 'px';
			}
			if (y) {
				this.frame.style.top = y + 'px';
			}
		}
	});
	
	(function() {
		var fixProto = exports.fixPositionElement.prototype;
		var Event = XN.event;
		var currentDialog = null;

		exports.clearDialog = function() {
			if (currentDialog && currentDialog.parent) currentDialog.remove();
		}

		/**
		 * 创建一个dialog
		 * <pre>
		 * 参数形式如下
		 * {
		 *  HTML:''//自定义对话框的html代码
		 * }
		 *
		 * 自定义代码中必须包含下面三个id的元素
		 *  ui_dialog_header
		 *  ui_dialog_body
		 *  ui_dialog_footer
		 * </pre>
		 * @namespace XN.ui
		 * @class dialog
		 * @constructor
		 * @param {Object} params
		 * @extends XN.ui.fixPositionElement
		 */		
		exports.dialog = function(params) {
			var This = this;
			currentDialog = this;
			exports.fixPositionElement.call(this, params);
			
			this.container = XN.element.$element('div');
			this.frame.appendChild(this.container);

			if (this.getConfig('HTML'))
				this.setContent(this.getConfig('HTML'));
			else
				this.setContent(this.buildHTML());

			this.dialogContainer = XN.element.$('ui_dialog_container');
			this.header = this.title = XN.element.$('ui_dialog_header');
			this.body = this.msg = this.message = XN.element.$('ui_dialog_body');
			this.footer = XN.element.$('ui_dialog_footer');
			this.closeButton = XN.element.$('ui_dialog_close');

			this.header.addChild = this.body.addChild = this.footer.addChild = function(s) {
				XN.element.addChild(this, s);
				setTimeout(function() {This.refresh();},0);
			};
			
			this.dialogContainer.removeAttribute('id');
			this.header.removeAttribute('id');
			this.body.removeAttribute('id');
			this.footer.removeAttribute('id');
			this.closeButton.removeAttribute('id');	
			
			if (this.getConfig('showCloseButton')) {
				this.closeButton.show();
				XN.event.addEvent(this.closeButton, 'click', function() {
					This.hide();
					This.fireEvent('close');
				});
			}

			//lower than menu
			this.frame.style.zIndex = 10000;
			
			this.setWidth(this.getConfig('width') || 400);
			
			if (this.getConfig('height')) 
				this.setHeight(this.getConfig('height'));
			
			XN.array.each(['title', 'msg', 'message', 'header', 'body', 'footer'], function(i, v) {
				if (This.getConfig(v)) 
					This[v].setContent(This.getConfig(v));
			});
			
			if (this.getConfig('type')) this.setType(this.getConfig('type'));
			
			this._buttons = [];
			
			XN.event.addEvent(this.footer, 'click', function(e) {
				This._parseButtonEvent(e || window.event);
			});

			XN.util.hotKey.add('27', this._hotKeyEvent, this);

			if (this.getConfig('modal') === true)
				XN.dom.disable();
			
			if(this.getConfig('noHeader'))
				this.header.hide();
				
			if(this.getConfig('noFooter'))
				this.footer.hide();
				
			if(this.getConfig('noPadding'))
				this.body.addClass('no_padding');
		};
		
		exports.dialog.prototype = XN.$extend({}, fixProto);
		XN.$extend(exports.dialog.prototype,  {
			header : null,
			body : null,
			footer : null,
			_iframe : null,
			_buttons : null,
			
			buildHTML : function() {
				return [
					'<table id="ui_dialog_container" style="width: 100%; height: 100%;" class="pop_dialog_table">',
						'<tbody>',
							'<tr>',
								'<td class="pop_topleft"></td>',
								'<td class="pop_border"></td>',
								'<td class="pop_topright"></td>',
							'</tr>',
							'<tr>',
								'<td class="pop_border"></td>',
								'<td class="pop_content">',
									'<h2><span id="ui_dialog_header"></span><a style="display:none;" class="close-button" id="ui_dialog_close" href="#nogo" onclick="return false;">关闭</a></h2>',
									'<div class="dialog_content">',
										'<div id="ui_dialog_body" class="dialog_body"></div>',
										'<div id="ui_dialog_footer" class="dialog_buttons"></div>',
									'</div>',
								'</td>',
								'<td class="pop_border"></td>',
							'</tr>',
							'<tr>',
								'<td class="pop_bottomleft"></td>',
								'<td class="pop_border"></td>',
								'<td class="pop_bottomright"></td>',
							'</tr>',
							'</tbody>',
						'</table>'
				].join('');
			},

			/**
			 * 通过一个按钮的标题获取按钮的实例
			 * @method getButton
			 * @param {String} text
			 * @return {XN.ui.button}
			 */			
			getButton : function(text) {
				var buttons = this._buttons;

				for (var i = buttons.length - 1; i >= 0; i --) {
					if (buttons[i].text == text) return buttons[i];
				}
				
				return null;
			},

			/**
			 * 向对话框底部添加按钮
			 * <pre>
			 *  参数形式如下: 
			 *  {
			 *      text : '',//按钮的文字
			 *      onclick : callback//按钮onclick时触发的函数
			 *  } 
			 * </pre>
			 * @method addButton
			 * @param {Object} b
			 * @return {Object} this
			 */			
			addButton : function(b) {
				var o = {
					text : b.text,
					_onclickForDialog : b.onclick				
				};
				if (b.className) o.className = b.className;
				var button = new exports.button(o);

				/*
				 * patch for panel
				 */
				
				button.frame.setAttribute('dialog', '1');

				/*
				 * patch end
				 */

				this._buttons.push(button);

				this.footer.addChild(button);
				return this;
			},

			/**
			 * 从从对话框删除按钮，参数为按钮的文字
			 * @method delButton
			 * @param {String} b title of the button
			 * @return {Object} this
			 */			
			delButton : function(b) {
				if (XN.isString(b)) b = this.getButton(b);

				this.footer.delChild(b);
				return this;
			},
			
			
			_preventHide : false,

			/**
			 * 阻止对话框关闭，用于按钮的回调函数
			 * <pre>
			 * callBack=function()
			 * {
			 *  this.preventHide();
			 *  .....
			 * }
			 * </pre>
			 * @method preventHide
			 * @return {Object} this
			 */
			preventHide : function() {
				this._preventHide = true;
				return this;
			},
			
			setAutoHide:function(boo) {
				this._preventHide = !boo;
				return this;
			},

			_parseButtonEvent : function(e) {
				var el = Event.element(e);
				if (el.tagName.toLowerCase() !== 'input' || el.type !== 'button') return;
				if (!el.getAttribute('dialog')) return;
				
				var button = this.getButton(el.value);
				
				if (button && button._onclickForDialog) {
					button._onclickForDialog.call(this);
				}
				
				if (this._preventHide) {
					this._preventHide = true;
				} else {
					this.hide();
					//XN.dom.enable();
				}
			},

			_hotKeyEvent : function() {
				this.hide();
			},
			
			/**
			 * 设置对话框的样式'normal' or 'error' type
			 * @method setType
			 * @param {String} t
			 * @return {Object} this
			 */			
			setType : function(t) {
				if (t == 'normal') {
					this.frame.delClass('errorDialog');
				} else if (t == 'error') {
					this.frame.addClass('errorDialog');
				}
				return this;
			},
			
			/**
			 * 设置对话框宽度
			 * @method setWidth
			 * @param {Int} w
			 * @return {Object} this
			 */			
			setWidth : function(w) {
				if (!w) return this;

				if (w == 'auto') {
					this.frame.style.width = 'auto';
					this.dialogContainer.style.height = '';
					this.dialogContainer.style.width = '';
					this.width = this.frame.offsetWidth;
				} else {
					this.width = w;
					this.frame.style.width = w + 'px';
					this.dialogContainer.style.height = '100%';
					this.dialogContainer.style.width = '100%';
				}

				this.refresh();
				return this;
			},
			
			/**
			 * 设置对话框高度，一般是自动伸展
			 * @method setHeight
			 * @param {Int} h
			 * @return {Object} this
			 */			
			setHeight : function(h) {
				if (!h)return this;
				this.hegith =  h;
				this.frame.style.height = h + 'px';
				this.refresh();
				return this;
			},
			
			/**
			 * resize
			 * @method resizeTo
			 * @param {Int} w
			 * @param {Int} h
			 * @return {Object} this
			 */
			resizeTo : function(w, h) {
				this.setWidth(w);
				this.setHeight(h);
				return this;
			},
			
			/**
			 * 清空对话框的内容
			 * @method clear
			 * @return {Object} this
			 */			
			clear : function() {
				this.header.setContent('');
				this.body.setContent('');
				this.footer.setContent('');
				this._buttons = [];
				return this;
			},
					
			/**
			 * 设置对话框的标题
			 * @method setTitle
			 * @param {String} s
			 * @return {Object} this
			 */			
			setTitle : function(s) {
				this.header.setContent(s);
				return this;
			},
			
			/**
			 * 设置对话框的内容
			 * @method setBody
			 * @param {String} s
			 * @return {Object} this;
			 */			
			setBody : function(s) {
				this.body.setContent(s);
				return this;
			},


			remove : function(keepModal) {
				XN.util.hotKey.del('27', this._hotKeyEvent);
				exports.element.remove.call(this);
				if(!keepModal)
					XN.dom.enable();
				return this;
			},
			
			refresh : function() {
				if (this.visible())
					fixProto.show.apply(this, arguments); 
				else
					this.hide();
				return this;
			},
			
			/**
			 * 重新设定弹层的位置
			 * 一般弹层内容都是弹层出来之后才append进去,这个时候弹层的位置就偏下了,用这个重新定位一下
			 * 但是调用这个窗口会跳一下,不完美.. 而且窗口添加了东西 会自动调用上面的refresh,只是那个东西只算离上边200px 不算剧中....
			 * @author <jicheng.li> 2011-03-11
			 */
			reLocate: function() {
				//重新居中定位这个窗口
				var w = this.frame;
				var s = XN.event.scrollTop();  //获取滚动条的位置
				var newTop = (XN.event.winHeight() - w.offsetHeight)/2;
				newTop = (newTop <= 0) ? s : newTop + s;  //防止减出负值 极端状况顶头显示
				w.style.top = newTop + 'px';
			},
			
			show : function() {
				this._clearHideTimer();
				if(this.getConfig('modal') === true)
					XN.dom.disable();
				fixProto.show.apply(this, arguments);			
				this.fireEvent('show');
				return this;
			},

			hide : function() {
				this._clearHideTimer();
				fixProto.hide.apply(this, arguments);
				XN.dom.enable();
				this.fireEvent('hide');
				return this;
			},

			_hideTimer : null,
			_clearHideTimer : function() {
				if (this._hideTimer) {
					clearTimeout(this._hideTimer);
					this._hideTimer = null;
				}
			},
			
			/**
			 * 自动关闭对话框
			 * @method autoHide
			 * @param {Int} t
			 * @return {Object} this
			 */
			autoHide : function(t) {
				var This = this;
				this._hideTimer = setTimeout(function() {
					This.hide();
				}, t * 1000);
				return this;
			}
		});

		XN.event.enableCustomEvent(exports.dialog.prototype);
	})();

	/*
	 *  patch for old version
	 */
	this.panel = this.dialog;	
	this.dialog.prototype.setHeader = function(h) {
		if(h && h !== '') {
			this.header.addChild(h);
		} else {
			this.header.innerHTML = '';
		}	
	};
	this.dialog.prototype.setFooter = function(f) {
		if (f && f !== '') {
			this.footer.addChild(f);
		} else {
			this.footer.innerHTML = '';
		}
	};
	/*
	 * patch end
	 */

	/**
	 * 菜单
	 * <pre>
	 *  参数形式如下
	 *  {
	 *      button : 'el',//触发元素的id
	 *      hoverClass : 'classname',//菜单显示时button的样式
	 *      event : 'mouseover',//事件类型，还可以是click,manual
	 *      alignType : '4-1',//菜单对齐方式
	 *      delay :　0.2,//延迟时间，用于mouseover
	 *      useIframeInIE6 : true,//在ie6是否添加iframe
	 *      addIframe : false,//是否强制添加iframe
	 *  }
	 * </pre>
	 *
	 * @namespace XN.ui
	 * @class menu
	 * @constructor
	 * @param {Object} params
	 */
	this.menu = function(params) {
		var This = this;

		this.config = {
			alignType : '4-1',
			barOnshowClass : '',
			tagName : 'div',
			disalbeButtonClickEvent : true,
			fireOn : 'click',
			keep : 0.2,
			useIframeInIE6 : true,
			effectTime : 50 
		};

		XN.$extend(this.config, params);
		
		var frame;
		
		if (this.getConfig('text')) {
			this.frame = frame = XN.element.$element(this.getConfig('tagName'));
			frame.setContent(this.getConfig('text'));
		} else if (this.getConfig('button')) {
			this.frame = frame = XN.element.$(this.getConfig('button'));
		} else return false;
		
		this._alignType = this.getConfig('alignType');
		
		if (this.getConfig('menu')) {
			XN.element.$(this.getConfig('menu')).hide();

			this.menu = new exports.fixPositionElement({
				id : this.getConfig('menu'),
				alignType : this._alignType,
				alignWith : this.getConfig('alignWith') || this.frame,
				addIframe : this.getConfig('addIframe'),
				useIframeInIE6 : this.getConfig('useIframeInIE6')
			}); 
			this.container = this.menu.frame;
			this._canAddSubMenu = false;
		} else {
			var dt = XN.element.$element('div');
			dt.hide();
			this.menu = new exports.fixPositionElement({
				//tagName : 'div',
				id : dt,
				alignType : this._alignType,
				alignWith : this.getConfig('alignWith') || this.frame,
				addIframe : this.getConfig('addIframe'),
				useIframeInIE6 : this.getConfig('useIframeInIE6')
			});
			this.container = XN.element.$element('div');
			this._menu.setContent(this.container);
		}
		
		this.menu.setIndex(10001);

		XN.event.addEvent(this.menu.frame, 'click', function(e) {
			e = e || window.event;
			This._frameOnClick(e);
		}, false);
		this.menu.setOffsetX(this.getConfig('offsetX') || 0);
		this.menu.setOffsetY(this.getConfig('offsetY') || 0);
		var eventType = this.getConfig('event');
		if (eventType == 'click') {
			XN.event.addEvent(this.frame, 'click', function(e) {
				This._buttonClick(e || window.event);
			});
			XN.event.addEvent(document, 'click', function(e) {
				This._documentClick(e || window.event);
			});
		} else if (eventType == 'mouseover') {
			XN.event.addEvent(this.frame, 'mouseover', function(e) {
				This._frameMouseOver(e || window.event);
			});
			
			if (this.getConfig('disalbeButtonClickEvent')) {
				XN.event.addEvent(this.frame, 'onclick', function(e) {
					XN.event.stop(e || window.event);
				});
			}
			
			XN.event.addEvent(this.frame, 'mouseleave', function() {
				This._buttonMouseLeave();
			});
			
			XN.event.addEvent(this.menu.frame, 'mouseleave', function() {
				This._menuMouseLeave();
			});
			
			XN.event.addEvent(this.menu.frame, 'mouseover', function() {
				This._mouseOverMenu = true;
			});
		} else if (eventType == 'manual') {
		}

		XN.event.addEvent(window, 'resize', function() {
			This.menu.refresh();
		});

		this.hide();
	};

	this.menu.prototype = XN.$extend({}, this.container);

	XN.$extend(this.menu.prototype, {
		isShow : true,
		menu : null,
		_alignType : null,
		_button : null,
		_canAddSubMenu : true,
		_delayTimer : null,
		_mouseOverMenu : false,
		_mouseOverButton : false,
		_clearTimer : function() {
			if (this._delayTimer) {
				clearTimeout(this._delayTimer);
				this._delayTimer = null;
			}
		},
		_buttonClick : function(e) {
			XN.event.stop(e);
			if (this.isShow) 
				this.hide();
			else
				this.show();
		},
		_documentClick : function(e) {
			this.hide();
		},
		
		_frameOnClick : function(e) {
			var This = this;
			var el = XN.event.element(e);
			var tag = el.tagName.toLowerCase();

			if (tag == 'a') return true;
			if ((tag == 'input' && (el.type == 'radio' || el.type == 'checkbox')) || tag == 'label') {
				this.isShow = false;
				setTimeout(function() {
					This.isShow = true;
				}, 20);
				return true;
			}
			
			while (el != this.menu.frame && el.tagName && el.tagName.toLowerCase() != 'a') {
				el = el.parentNode;
			} 
			
			if (el.tagName.toLowerCase() == 'a') return true;
			
			XN.event.stop(e);
		},

		_frameMouseOver : function(e) {
			var This = this;
			this._mouseOverButton = true;
			
			this._clearTimer();
			
			var delay = this.getConfig('delay');
			if (delay) {
				this._delayTimer = setTimeout(function() {
					if (This._mouseOverButton) This.show();
				}, delay * 1000);
			} else {
				This.show();
			}
			if (!this.getConfig('keepDefaultEvent')) {
				XN.event.stop(e);
			}
		},
		_buttonMouseLeave : function() {
			var This = this;
			this._mouseOverButton = false;
			this._clearTimer();
			setTimeout(function() {
				if (!This._mouseOverMenu) {
					This.hide();
				}
			}, this.getConfig('effectTime'));
		},
		_menuMouseLeave : function() {
			var This = this;
			this._mouseOverMenu = false;
			this._clearTimer();
			setTimeout(function() {
				if (!This._mouseOverButton) This.hide();
			}, this.getConfig('effectTime'));
		},
		getConfig : function(key) {
			var patch = {
				'hoverClass' : 'barOnshowClass',
				'event' : 'fireOn',
				'button' : 'bar',
				'delay' : 'keep'
			};
			if (patch[key]) {
				return this.config[key]  || this.config[patch[key]];
			}

			return this.config[key];
		},

		/**
		 * 显示菜单
		 * @method show
		 * @return {XN.ui.menu} this
		 */
		show : function() {
			if (this.isShow) return this;
			this.menu.show();
			var className = this.getConfig('hoverClass'); 
			if(className != '') {
				this.frame.addClass(this.getConfig('hoverClass'));
			}
			this.onShow();
			this.isShow = true;
			return this;
		},
		
		/**
		 * 设置菜单宽度
		 * @method setWidth
		 * @param {Int} width
		 * @return {XN.ui.menu} this
		 */
		setWidth : function(w) {
			this.menu.frame.style.width = w + 'px';
			this.menu.refresh();
			return this;
		},
			
		/**
		 * 隐藏菜单
		 * @method hide
		 * @return {XN.ui.menu} this
		 */
		hide : function() {
			if (!this.isShow) return this;
			this.menu.hide();
			this.frame.delClass(this.getConfig('hoverClass'));
			this.isShow = false;
			this.onHide();
			return this;
		},
		
		/**
		 * 刷新菜单
		 * @method refresh
		 * @return {XN.ui.menu} this
		 */
		refresh : function() {
			if (this.isShow) {
				this.menu.show();
			}
			return this;
		},

		onShow : XN.func.empty,
		onHide : XN.func.empty
	});

	XN.event.enableCustomEvent(this.menu.prototype);
	/**
	 * 自动完成
	 * <pre>
	 * 参数如下: 
	 *  {
	 *      input:id,//要使用自动完成的input元素
	 *      searchDelay:num,//输入与搜索之间的延迟
	 *      DS:obj,//搜索用的数据源,参见XN.util
	 *      enableCache:true,//是否使用缓存
	 *      maxCache:10//最大缓存长度
	 *  }
	 * </pre>
	 *
	 * @namespace XN.ui
	 * @class autoComplete
	 * @constructor
	 * @param {Object} p
	 * @extends XN.ui.element
	 */
	this.autoComplete = function(p) {
		var This = this;
		
		this.config = this.config || {};
		
		XN.$extend(this.config, {
			inputTip : null,
			searchDelay : 0.2,
			DS : null,
			enableCache : true,
			maxCache : 10
		});
		
		XN.$extend(this.config, p);
		
		if (this.getConfig('enableCache')) {
			this.cache = new XN.util.cache({
				cacheLength : this.getConfig('maxCache')
			});
		}
		
		if (this.getConfig('input')) {
			var input = this.input = XN.element.$(this.getConfig('input'));
		} else {
			var input = this.input = XN.element.$element('input');
			input.type = 'text';
			input.addClass('input-text');
		}

		
		this.frame = input;
		
		XN.event.addEvent(input, 'focus', function(e) {
			This._startCheck();
			This.fireEvent('focus');
		});
		
		XN.event.addEvent(input, 'blur', function(e) {
			This._endCheck();
			This.fireEvent('blur');	
		});

		this.addEvent('focus', function() {
			var v = this.input.value;
			if (v == '' || v == this.getConfig('inputTip')) {
				this.fireEvent('noinput');
			}
		});

		this.addEvent('blur', function() {
			this._lastInput = null;
		});

		XN.event.addEvent(input, 'click', function(e) {
			XN.event.stop(e || window.event);
		});
		
		XN.event.addEvent(input, 'keydown', function(e) {
			This._userInput = true;
			e = e || window.event;
			if (e.keyCode == 13) XN.event.stop(e);
			This.fireEvent('keydown', e);
		});
		
		input.setAttribute('AutoComplete', 'off');

		this.DS = this.getConfig('DS');
	};

	this.autoComplete.prototype = XN.$extend({}, this.element);

	XN.$extend(this.autoComplete.prototype, {
		input : null,
		cache : null,
		_userInput : false,
		_lastInput : null,
		
		getConfig : function(key) {
			if (key == 'input') return this.config['input'] || this.config['id'];
			return this.config[key];
		},
		
		_startCheck : function() {
			var This = this;
			this._inputTimer = setInterval(function() {
				if(This._userInput) {
					This._userInput = false;
					return;
				}
				This._checkInput();
			},this.getConfig('searchDelay') * 1000);
		},
		
		_endCheck : function() {
			clearInterval(this._inputTimer);
			this._inputTimer = null;		
		},
		
	   
		_checkInput : function() {
			var This = this;
			var cv = this.input.value;
			
			if(XN.string.isBlank(cv)) {
				if (this._lastInput === '') {
					return;
				}

				this._lastInput = '';
				this.fireEvent('noinput');

				return;
			}
			
			if(cv == this._lastInput) { 
				return;
			}

			this._lastInput = cv;
			
			this.fireEvent('searchbegin');
			
			if(this.cache) {
				var result = this.cache.get(cv);
				if(result) {
					this.fireEvent('searchover', result);
					return;
				}
			}
			
			if (!this.DS) {
				XN.log('no ds');
				this.fireEvent('NO_DS');
				return;
			}
			
			this.DS.query(cv, function(r) {
				if(This.cache) This.cache.add(cv, r);
				This.fireEvent('searchover', r);
			});		
		}
	});

	XN.event.enableCustomEvent(this.autoComplete.prototype);

	(function() {

		var completeMenus = {};

		getCompleteMenu = function(id) {
			return  completeMenus[id];
		};

		getParentFromClass = function(target, classname) {
		    var parent = null;
		    while(target.parentNode) {
		        target = target.parentNode;
		        if(XN.element.hasClassName(target, classname)) {
		            parent = target;
		            break;
		        }
		    }
		    return parent;
		};

		/**
		 * 自动完成菜单
		 * @namespace XN.ui
		 * @class autoCompleteMenu
		 * @constructor
		 * @param {Object} p
		 * @extends XN.ui.autoComplete
		 */
		exports.autoCompleteMenu  = function(p) {
			var This = this;
			
			this._MID = XN.util.createObjID();
			
			completeMenus[this._MID] = this;

			this.config = this.config || {};
			
			XN.$extend(this.config ,
			{
				ulClassName : '',
				liClassName : '',
				liHoverClass : 'm-autosug-hover',
				aClassName : '',
				noResult : '没有匹配结果',
				dataLoading : '正在加载数据...',
				noInput : null,
				autoSelectFirst : false,
				noHighlightClass: 'noHighlight'
			});
			
			exports.autoComplete.call(this, p);
			
			var input = this.input;

			var m = XN.element.$element('div');
			m.innerHTML = this.getConfig('wrapper') || this._wrapper();
			
			this._menuList = m.firstChild;

			this._ul = this._menuList.getElementsByTagName('ul')[0];
			
			this.menu = new exports.menu( {
				button : input,
				menu : this._menuList,
				fireOn : 'manual'
			});

			this.addEvent('keydown', this._inputOnkeydown);
			
			XN.event.addEvent(this._ul, 'mousedown', function(e) {
				This._menuOnclick(e || window.event);
			});
			
			/*
			XN.event.addEvent(this._ul, 'mousemove', function(e)
			{
				return This._menuOnmouseover(e || window.event);
			});
			*/
			/*XN.event.addEvent(document, 'click', function() {
				This.menu.hide();
			}, false);*/
			XN.event.addEvent(input, 'blur', function() {
				This.menu.hide();
			});

			this.menu.hide();
			
			/*
			 * 没有输入时关闭菜单
			 */
			this.addEvent('noinput', function() {
				var tip = this.getConfig('noInput');
				if(!tip) {
					this.menu.hide();
					return;
				}
				this._ul.innerHTML = '<li>' + tip + '</li>';
				this.menu.show();
			});
			
			this.addEvent('NO_DS', function() {
				  this._noDataShow();
			});
					
			this.addEvent('searchover' ,function(result) {
				  this._buildMenu(result);
			});
		};

		exports.autoCompleteMenu.prototype = XN.$extend({}, exports.autoComplete.prototype);

		XN.$extend(exports.autoCompleteMenu.prototype, {
			menu : null,
			_menuList : null,
			_ul : null,
			_currentLi : null,
			_highlightMenuItem : function(li) {
				if (li == this._currentLi) return;
				var hoverClass = this.getConfig('liHoverClass');
				if (this._currentLi !== null) {
					XN.element.delClass(this._currentLi, hoverClass);
				}
				XN.element.addClass(li, hoverClass);
				this._currentLi = li;
				var aid = this._currentLi.getAttribute('aid');

				if(aid) {
					this.fireEvent('highlight', this.result[parseInt(aid)]);
				}
			},

			/*
			 *  判断列表中是否只有一个非highlight元素
			 */
			_checkOnlyOneNoHightlightEl: function() {
				return (
						this._ul.lastChild == this._ul.firstChild && 
						XN.element.hasClassName(this._ul.firstChild, this.config.noHighlightClass)
					);
			},

			/*
			 *  键盘事件处理函数
			 */
			_inputOnkeydown : function(event) {
				var li;

				/*
				 *   回车选择一个菜单项
				 */
				if (event.keyCode == 13) {
					if(this.menu.isShow && this._currentLi)
					{
						var aid = this._currentLi.getAttribute('aid');
						if(aid) this._selectMenuItem(parseInt(aid));
					}
					return false;
				}

				/*
				 *  向上高亮上一个
				 */
				if (event.keyCode == 38) {
					if(this._checkOnlyOneNoHightlightEl()) return;

					if (this._currentLi && this._currentLi.previousSibling)
					{
						li = this._currentLi.previousSibling;
					}
					else
					{
						li = this._ul.lastChild;			
					}
					
					// 跳过不需要highlight的元素
					while(XN.element.hasClassName(li, this.config.noHighlightClass)) {
						if(li.previousSibling) li = li.previousSibling;
						else li = this._ul.lastChild;
					}
					
					this._highlightMenuItem(li);
					return false;
				}

				/*
				 *  向下高亮下一个
				 */
				if (event.keyCode == 40) {
					if(this._checkOnlyOneNoHightlightEl()) return;
					
					if (this._currentLi && this._currentLi.nextSibling)
					{
						li = this._currentLi.nextSibling;
					}
					else
					{
						li = this._ul.firstChild;			
					}

					// 跳过不需要highlight的元素
					while(XN.element.hasClassName(li, this.config.noHighlightClass)) {
						if(li.nextSibling) li = li.nextSibling;
						else li = this._ul.firstChild;
					}

					this._highlightMenuItem(li);
					return false;
				}
				
				return true;
			},

			/*
			 *  当在菜单上点击时触发
			 */			 
			_menuOnclick : function(event) {
				var el = XN.event.element(event);
				
				while (el && el.tagName && el.tagName.toLowerCase() !== 'li')
				{
					el = el.parentNode;
				}
				
				if (!el || el.nodeType !== 1 || !el.getAttribute('aid')) return false;
				this._selectMenuItem(parseInt(el.getAttribute('aid')));
				return false;
			},

			/*
			 *  当在菜单上移动鼠标时触发
			 */
			_menuOnmouseover : function(event) {
				var el = XN.event.element(event);
				if (el.parentNode == XN.element.$('dropmenuHolder')) return;
				while (el && el.tagName &&  el.tagName.toLowerCase() !== 'li') {
					el = el.parentNode;
				}
				
				if (!el || el.nodeType !== 1 || !el.getAttribute('aid')) return false;
				this._highlightMenuItem(el);
				return false;
			},
			
			/*
			 *  选择一个菜单项
			 */
			_selectMenuItem : function(id) {
				this.menu.hide();

				if(!getParentFromClass(this._menuList, 'feed-comment-attach')) {
					this.input.focus();
				}
				this.fireEvent('select', this.result[id]);
				this._lastInput = this.input.value;
			},

			/*
			 * 匹配结束,显示匹配结果
			 */
			_buildMenu : function(result) {
				var This = this;
				this.result = result;
				
				if (result.length > 0) {
					this.fireEvent('hasResult');
				}
				if (result.length == 0) {
					this.fireEvent('noResult');
					var noResult = this.getConfig('noResult');

					if (XN.isFunction(noResult)) {
						noResult = noResult.call(this);
					}

					this._ul.innerHTML = '<li>' + noResult + '</li>';
					this.menu.show();
					this._currentLi = null;
					return;
				}

				var lis = [];

				lis.push(this.firstMenuItem());
				
				var len = result.length - 1;

				XN.array.each(result, function(i, v) {
					lis.push('<li onmouseover="getCompleteMenu(' + This._MID + ')._highlightMenuItem(this);" aid="' + i + '">' + This.buildMenu(v) + '</li>');
				});
				
				lis.push(this.lastMenuItem());

				this._ul.innerHTML = lis.join('');
				
				if(this.getConfig('autoSelectFirst')) this._highlightMenuItem(this._ul.firstChild);
				
				this.menu.show();
			},
			_noDataShow :function() {
				var tip = this.getConfig('dataLoading');
				this._ul.innerHTML = '<li>' + tip + '</li>';
				this.menu.show();			
			},

			firstMenuItem : function() {
				return '';
			},
			
			lastMenuItem : function() {
				return '';
			},

			buildMenu : function(r) {
				return '<li>' + r.name + '</li>';
			},
			setMenuWidth : function(w) {
				this.menu.setWidth(w);
			},

			// 获得当前选中项
			getCurrentItem: function() {
				return this._currentLi;
			},
			
			// 设置当前选中项
			setCurrentItem: function(item) {
				this._currentLi = item;
			}
		});
		//XN.ui._friendsCacheData = null;
		exports.autoCompleteMenu.prototype._wrapper = function() {
			return [
			'<div class="m-autosug">',
				'<span class="x1">',
					'<span class="x1a"></span>',
				'</span>',
				'<span class="x2">',
					'<span class="x2a"></span>',
				'</span>',
				'<div class="m-autosug-minwidth">',
					'<div class="m-autosug-content">',
						'<ul></ul>',
					'</div>',
				'</div>',
			'</div>'
			].join('');
		};
	})();

	this.friendSelector = function(params) {
		var This = this;
		this.config = this.config || {};
		
		XN.$extend(this.config, {
			getFriendsUrl: 'http://browse.' + XN.env.domain + '/getfriendsajax.do?s=1',
			url : 'http://sg.' + XN.env.domain + '/s/f',
			aurl: 'http://friend.' + XN.env.domain + '/friendsSelector.do',
			param : {}
		});
		if(this.config.url.indexOf('sg.renren.com/s/m')!=-1){
			this.config.aurl = 'http://friend.' + XN.env.domain + '/friendSelectorForVip';
		}

		XN.$extend(this.config, params.params)
		if(XN.isUndefined(this.getConfig('page'))) {
			this.config['page'] = false;
		}

		exports.autoCompleteMenu.call(this, params);
		
		this.addEvent('select', function(r) {
			this.input.value = r.name;
			if (this.onSelectOne) this.onSelectOne(r);			
		});
		
		this.buildMenu = function(r) {
			return r.name ;
		};
		
		this.addEvent('focus', function()
		{
			if (this._ready) return;
			if (this._isLoading) return;
			this.loadFriends();
		});
	};

	this.friendSelector.prototype = XN.$extend({}, this.autoCompleteMenu.prototype);
	XN.$extend(this.friendSelector.prototype, {
		_isLoading:false,
		_ready:false,
		
		isReady : function() {
			return this._ready;
		},

		isLoading : function() {
			return this._isLoading;
		},
		
		loadFriends:function(r) {
			if (this.isLoading()) return;
			this._isLoading = true;
			var This = this;
			var p = {};
			p['init'] = true;
			p['uid'] = false;
			p['uhead'] = false;
			p['uname'] = false;
			p['group'] = false;
			p['net'] = false;
			p['param'] = this.getConfig('param');
			p['page'] = this.getConfig('page');

			new XN.net.xmlhttp({
				useCache : true,
				url : this.getConfig('aurl'),
				method : 'get', // TODO 李勇改 post
				data : 'p=' + XN.json.build(p),
				onSuccess : function(r) {
					r = XN.json.parse(r.responseText);
					This._onload(r);
				}
			});
		},
		
		_onload : function(r) {
			this.isLoading = false;
			this._ready = true;
			this.config.qkey = r.qkey;
			this.DS = new XN.util.DS_friends( {
				//method: 'post', // TODO 李勇改 post
				url : this.getConfig('url'),
				qkey : this.getConfig('qkey'),
				limit : this.getConfig('limit'),
				page : this.getConfig('page'),
				param : this.getConfig('param')
			});
			this.DS.query = function( v , callBack ){
				var This = this;
				try{
					this._request.abort();
				}catch(e){}
				function parseDS_JSON( r ){
					r = r.responseText;
					var pp;
					try{
						var rt = XN.JSON.parse( r );
						if ( This.rootKey && rt[ This.rootKey ] ){
							pp = rt[ This.rootKey ];
						}else{
							pp = rt;
						}
					}
					catch( e ){
						pp = [];
					}
					callBack( pp );
				}
				var paramJ = XN.json.parse(this.param);
				this._request = new XN.net.xmlhttp({
					url : this.url,
					data : 'q=' + encodeURIComponent( v ) + ( !!this.limit?('&l=' + this.limit):'' ) + ( !!paramJ.friendId?('&friend='+paramJ.friendId):'' ), 
					method : this.method,
					onSuccess : parseDS_JSON
				});
			};
		}
	});

	this.friendSelectorSynchronous = function(a, b) {
		function s(id, ac, v) {
			if (XN.isObject(id)) id = id.id;

			if (v.isReady()) {
				try{
					v[ac](id);
				} catch(e) {}
			} else {
				v.addEvent('load', function() {
					try{
						v[ac](id);
					} catch(e) {}
				});
				v.loadFriends();
			}
		}
		
		a.addEvent('select', function(id) {
			s(id, 'select', b);
		});
		a.addEvent('deselect', function(id) {
			s(id, 'deselect', b);
		});
		b.addEvent('select', function(id) {
			s(id, 'select', a);
		});
		b.addEvent('deselect', function(id) {
			s(id, 'deselect', a);
		});
	};


	(function() {

		/**
		 * 多好友选择器
		 * <pre>
		 * 参数形式如下
		 * {
		 *      idInputName:'ids',//生成的id字段input的name属性
		 *      nameInputName:'names',//生成的name字段input的name属性
		 *      url:'/friendsSelector.do',//初始化的url
		 *      initParam:{},//初始化参数
		 *      param:{},//查询好友的额外参数
		 *      maxNum:0//最大数量限制，超出时会触发'overMaxNum'事件
		 *      loadMethod : 'get' | 'post' //载入好友的请求方式
		 * }
		 * </pre>
		 * @namespace XN.ui
		 * @class multiFriendSelector
		 * @constructor
		 * @param {Object} params
		 */
		exports.multiFriendSelector = function(params) {
			var This = this;
			//ID_PRE ++;
			this._ID = XN.util.createObjID();

			this.config = this.config || {};
			XN.$extend(this.config, {
				inputName : 'ids',
				nameInputName : 'names',
				aurl : 'http://friend.' + XN.env.domain + '/friendsSelector.do',
				url : 'http://sg.' + XN.env.domain + '/s/f',
				initParam : {},
				param : {},
				noInput : false,
				maxNum : -1 
			});
			
			XN.$extend(this.config, params);
			
			if(this.config.url.indexOf('sg.renren.com/s/m')!=-1){
				this.config.aurl = 'http://friend.' + XN.env.domain + '/friendSelectorForVip';
			}
			
			this.frame = XN.element.$element('div');
			var div = XN.element.$element('div');
			div.hide();
			document.body.appendChild(div);
			div.appendChild(this.frame);
			
			this.frame.innerHTML = [
				'<div id="' + this.getID('friendsContainer') + '" class="tokenizer friendAutoSelector">',
				'<span id="' + this.getID('inputContainer') + '" class="tokenizer_input"><input id="' + this.getID('input') + '" type="text" /></span>',
				'</div>',
				'<div class="float-right" id="' + this.getID('menu') + '"></div>'
			].join('');
			
			/*
			 * patch for old version
			 */			
			this.input = this.getEl('input');
			this.menuContainer = this.getEl('menu');

			//this._friendsContainer = this.frame.firstChild;
			//this._inputContainer = this.frame.getElementsByTagName('span')[2];
			/*
			 * patch end
			 */

			XN.event.addEvent(this.getEl('friendsContainer'), 'click', function(e) {
				This._parseClickEvent(e || window.event);
			});
			
			this.autoComplete = new exports.friendSelector( {
				id : this.input,
				inputTip : '输入好友姓名...',
				autoSelectFirst : true,
				url : this.getConfig('url'),
				aurl: this.getConfig('aurl'),
				param : this.getConfig('param')
			});

			this.autoComplete.loadFriends = function(r) {
				if (this.isLoading()) return;
				this._isLoading = true;
				var p = {};
				p['init'] = true;
				p['uid'] = true;
				p['uhead'] = false;
				p['uname'] = true;
				p['group'] = false;
				p['net'] = false;

				XN.$extend(p, This.getConfig('initParam'));
				
				p['param'] = this.getConfig('param');

				new XN.net.xmlhttp( {
					useCache : true,
					url : this.getConfig('aurl'),
					method : This.getConfig('loadMethod') || 'get',
					data : 'p=' + XN.json.build(p),
					onSuccess : function(r) {
						r = XN.json.parse(r.responseText);
						This._allFriends = r.candidate;
						This.fireEvent('load');
						This.autoComplete._onload(r);
					}
				});
			};
			
			this.autoComplete.buildMenu = function(r) {
				return '<p>' + r.name + '</p>';
			};

			this.autoComplete.setMenuWidth(129);
			this.autoComplete.addEvent('keydown' ,function(e) {
				This._onInputKeydown(e);
			});
			this.autoComplete.addEvent('select', function(r) {
				XN.log(this.input);
				this.input.value = '';
				This.selectFriend(r);
			});

			if (this.getConfig('noInput')) {
				this.input.hide();
			}
			
			this.fireEvent('init');
		};
		var proto = exports.multiFriendSelector.prototype = XN.$extend({}, exports.element);
		
		XN.$extend(proto, {
			//_friendsContainer : null,
			//_inputContainer : null,
			
			/**
			 * 选择器是否就绪
			 * @method isReady
			 * @return {Boolean}
			 */
			isReady : function() {
				return this.autoComplete.isReady();
			},

			isLoading : function() {
				return this.autoComplete.isLoading();
			},

			/**
			 * 加载好友数据
			 * @method loadFriends
			 */
			loadFriends : function() {
				this.autoComplete.loadFriends();
			},

			/**
			 * 跟据用户id得到一个用户对象
			 * @method getUserByID
			 * @param {String} id
			 * @return {Object}
			 */
			getUserByID : function(id) {
				id = String(id);
				var rt = null;
				XN.array.each(this._allFriends, function(i, v) {
					if (String(v.id) == id) {
						rt = v;
						return false;
					}
				});
				return rt;
			},

			getConfig : function(key) {
				if (key == 'inputName') return this.config['idInputName'] || this.config['inputName'];
				return this.config[key];
			},

			getID : function(id) {
				return 'mfs_' + this._ID + id;
			},
			
			getFriendID : function(id) {
				return this.getID('friend_' + id);
			},
		
			getFriendEl : function(id) {
				return XN.element.$(this.getFriendID(id));
			},

			getEl : function(id) {
				return XN.element.$(this.getID(id));
			},

			getFriendsNum : function() {
				return this.getEl('friendsContainer').getElementsByTagName('a').length;
			},
			
			/**
			 * 获取已选好友的id
			 * @method getSelectedFriends
			 * @return {Array}
			 */
			getSelectedFriends : function() {
				var rt = [];
				var a = XN.array.build(this.getEl('friendsContainer').getElementsByTagName('a'));
				XN.array.each(a, function(i, v) {
					rt.push(v.getAttribute('uid') + '');
				});
				return rt;
			},
			
			/**
			 * 重设选择器
			 * @method reset
			 */
			reset : function() {
				this.deselectAll(); 
			},

			/**
			 * 取消全选
			 * @method deselectAll
			 */
			deselectAll : function() {
				var els = XN.array.build(this.getEl('friendsContainer').getElementsByTagName('a'));
				XN.array.each(els, function(i, v) {
					XN.element.remove(v);
				});
				this.fireEvent('deselectAll', this.getIds());
			},
			
			/**
			 * 选择一组好友
			 * @method selectFriends
			 * @param {Array} a
			 */
			selectFriends : function(fs) {
				var This = this;
				XN.array.each(fs, function(i, v) {
					This.select(v);
				});
			},
			
			/**
			 * 反选一组好友
			 * @method deselectFriends
			 * @param {Array} a
			 */
			deselectFriends : function(fs) {
				var This = this;
				XN.array.each(fs, function(i, v) {
					This.deselect(v);
				});
			},
			
			/**
			 * 选择一个好友
			 * @method select
			 * @param {String} id
			 */
			select : function(o) {
				if (XN.isUndefined(o)) return; 
				XN.log('mfs select:');
				XN.log(o);
				var maxNum = this.getConfig('maxNum');
				
				if (maxNum !== -1) {
					if (this.getFriendsNum() ==  maxNum) {
						this.fireEvent('overMaxNum', maxNum);
						return;
					}
				}

				if (XN.isString(o) || XN.isNumber(o)) {
					o = {
						id : o,
						name : this.getUserByID(o).name
					};
				}

				if (this.getFriendEl(o.id)) return;
				
				this.getEl('friendsContainer').insertBefore(this.createFriendHTML(o.id, o.name), this.getEl('inputContainer'));
				this.fireEvent('select', o.id);
			},
			
			/**
			 * 反选一个好友
			 * @method deselect
			 * @param {String} id
			 */
			deselect : function(uid) {
				if (!this.getFriendEl(uid))return;
				this.getFriendEl(uid).remove();
				this.fireEvent('deselect', uid);
			},

			_parseClickEvent : function(e) {
				var el = XN.event.element(e);
				XN.event.stop(e);
				if (el && el.getAttribute('action')) {
					this.deselectFriend(el.getAttribute('uid'));
				}
			},

			createFriendHTML : function(uid, uname) {
				var a = XN.element.$element('a');
				a.id = this.getFriendID(uid);
				a.setAttribute('uid', uid);
				a.href = '#nogo';
				a.className = 'token';
				a.tabindex = '-1';
				a.innerHTML = [
					'<span>\n<span>\n<span>\n<span>\n<input type=\"hidden\" value=\"',
					uid,
					'" name=\"',
					this.getConfig('inputName'),
					'\" />\n',
					'<input type=\"hidden\" value=\"',
					uname,
					'" name=\"',
					this.getConfig('nameInputName'),
					'\" />\n',
					uname,
					'<span uid=\"',
					uid,
					'\" action=\"x\" class=\"x\" onmouseout=\"this.className=\'x\'\" onmouseover=\"this.className=\'x_hover\'\" >\n</span>\n</span>\n</span>\n</span>\n</span>'
				].join('');
				return a;
			},

			_onInputKeydown : function(event) {
				var i = this.getEl('inputContainer'),
				pa = i.previousSibling,
				na = i.nextSibling,
				input = this.input,
				c = this.getEl('friendsContainer');
				if (event.keyCode == 8 && this.input.value =='') {
					if(pa) {
						this.deselectFriend(pa.getAttribute('uid'));
					}
					return true;
				} else if (event.keyCode == 37 && this.input.value == '') {
					if (pa && pa.tagName.toLowerCase() == 'a') {
						i.parentNode.removeChild(i);
						c.insertBefore(i, pa);
						setTimeout(function() {input.focus();}, 0);
					}
					return true;
				} else if (event.keyCode == 39 && this.input.value == '') {
					if (na && na.tagName.toLowerCase() == 'a')
					{
						i.parentNode.removeChild(i);
						XN.dom.insertAfter(i, na);
						setTimeout(function() {input.focus();}, 0);
					}
					return true;
				}		
				return false
			}
		});

		XN.event.enableCustomEvent(proto);

		/*
		 * patch for old version
		 */
		proto.deSelectAll = proto.deselectAll;
		proto.deSelectFriend = proto.deselectFriend = proto.deselect;
		proto.selectFriend = proto.select;
		proto.getSelectedFriendsID = proto.getSelectedFriends;
		proto.getIds = proto.getSelectedFriends;
		/*
		 * patch end
		 */
		 
	})();

	this.friendSelectorWithMenu = function(p) {
		var selector = new exports.friendSelector(p);
		var menu = new exports.friendSelectorMenu({
			url : selector.getConfig('url'),
			aurl: selector.getConfig('aurl'),
			param : selector.getConfig('param'),
			multi : false ,
			alignType:p.alignType,
			offsetX:p.offsetX,
			offsetY:p.offsetY,
			initParam : p.initParam
		});

		var div = XN.element.$element('div');
		//selector.frame.parentNode.appendChild(div);
		div.addChild(selector);
		div.addChild(menu);
		selector.frame = div;
		//XN.ui.friendSelectorSynchronous(selector, menu);
		selector.addEvent('focus', function() {
			menu.menu.hide();
		});

		menu.addEvent('select', function(p) {
			var This = this;
			setTimeout(function() {
				This.menu.hide();
			},30);
			selector.fireEvent('select', this.getUserByID(p));
		});
		
		menu.menu.menu.setOffsetY(9);

		return selector;

	};

	this.multiFriendSelectorWithMenu = function(p) {
		var selector = new exports.multiFriendSelector(p);

		var menu = new exports.friendSelectorMenu({
			url : selector.getConfig('url'),
			aurl: selector.getConfig('aurl'),
			param : selector.getConfig('param'),
			multi : true,
			showSelectAllCheckbox : selector.getConfig('showSelectAllCheckbox') || false 
		});
		menu.addEvent('submit', function() {
			menu.menu.hide();
		});
		selector.menuContainer.setContent(menu);
		
		exports.friendSelectorSynchronous(selector, menu);
		
		return selector;
	};

	(function(ns) {
		//var ID_PRE = 0;	
		var DEBUG = false;
		var addEvent = XN.event.addEvent;
		
		var log = function(s) {
			if (DEBUG) XN.log (XN.isString(s) ? 'ui.tabView:' + s : s);
			return s;
		};

		/**
		 * tabview
		 * @namespace XN.ui
		 * @class tabView
		 * @constructor
		 * @param {Object} params
		 */
		
		ns.tabView = function(params) {
			this.config = {
				selectedClass : 'select',
				event : 'click',
				alwaysReload : false,
				mouseOverDelay : 0.2
			};
			XN.$extend(this.config, params);
			this.init();
		};

		ns.tabView.prototype = {	
			
			_tabs : null,
			_currentTab : null,
			_idPre : null,
			_tabIndex : 0,

			init : function() {
				this._idPre = XN.util.createObjID();
				this._tabs = [];
			},
			
			getConfig : function(key) {
				if (key == 'activeClass') return this.config['activeClass'] || this.config['selectedClass'];
				return this.config[key];
			},

			_getID : function(el) {
				if (el.nodeType && el.nodeType == 1)
					return this._setID(el).id;
				return el;
			},
			
			_setID: function(el) {
				if(!el.id) {
					this._tabIndex ++;
					el.setAttribute('id', 'tabview_' + this._idPre + '_' + this._tabIndex);
				}
				return XN.element.$(el);
			},
			
			//get tab obj by key or element id or element refer
			_getTab : function(id) {
				log('_getTab start');
				log('param:id');
				log(id);
				if (!id) return log(id);
				
				if (id.label) return log(id);

				var key = this._getID(id);
				log('key:' + key);
				
				var tabs = this._tabs;
				
				log('all tabs');
				log(tabs);
				
				for (var i = tabs.length - 1; i >= 0; i --) {
					if (tabs[i].key == key) {
						log('_getTab end');
						return log(tabs[i]);
					} 
				}
				
				log('_getTab end');	
				return log(null);
			},
			
			/**
			 * @method getCurrentTab
			 * @return {Object}
			 */			
			getCurrentTab : function() {
				return this._getTab(this._currentTab);
			},
			
			/**
			 * @method setCurrentTab
			 * @param {String} tab id
			 * @param {Boolean} forceReload
			 * @return {Object} this
			 */			
			setCurrentTab : function(tab, forceReload) {
				log ('setCurrentTab start');
				var oldC = this.getCurrentTab();
				var nowC = this._getTab(tab);
				
				log ('old current:');
				log(oldC);
				log('now current:');
				log(nowC);
				
				if (oldC && oldC.key == nowC.key && !forceReload) return;
				
				if (oldC) this._deactiveTab(oldC);
				this._activeTab(nowC);

				this._setCurrentTab(nowC);
				log('setCurrentTab end');

				this.fireEvent('change', nowC);
				
				return this;
			},

			/**
			 * @method reset
			 * @return {Object} this
			 */			
			reset : function() {
				var tab = this.getCurrentTab();
				if (tab) {
					this._deactiveTab(tab);
				}
				this._setCurrentTab(null);
				return this;
			},

			_activeTab : function(tab) {
				log('_activeTab:');
				log(tab);
				
				tab.getEl('label').addClass(this.getConfig('activeClass'));
				if (tab.content) tab.getEl('content').show();
				tab.onActive(tab);
				
				log('_activeTab end');
			},
			
			_deactiveTab : function(tab) {
				//防止元素被销毁
				if (tab.getEl('label')) {
					tab.getEl('label').delClass(this.getConfig('activeClass'));
				}
				if (tab.content) tab.getEl('content').hide();
				tab.onInactive(tab);
			},

			_setCurrentTab : function(tab) {
				log('_setCurrentTab start');
				tab = this._getTab(tab);
				
				log('currentTab:');
				log(tab);
				
				this._currentTab = tab ? tab.key : null;
				
				log('this._currentTab');
				log(this._currentTab);
				
				log('_setCurrentTab end');
			},

			/**
			 * @method addTab
			 * @param {Object} t
			 * @return {Object} this
			 */			
			addTab : function(t) {
				
				log('addTab start');
				log('params:');
				log(t);
				
				var This = this;
				
				var tab = {
					onActive : XN.func.empty,
					onClick : XN.func.empty,
					onInactive : XN.func.empty,
					onInit : XN.func.empty,
					getEl : function(key) {
						return XN.element.$(this[key]);
					},
					active : false
				};
				
				t.label = this._setID(XN.element.$(t.label));
				t.key = t.key || t.label.id;

				if (t.content) {
					t.content = this._getID(t.content);
					log('get content id:' + t.content);
				}
				
				XN.$extend(tab, t);

				this._tabs.push(tab);
				
				log('all tabs');
				log(this._tabs);
				
				if (tab.active && this._currentTab === null) {
					if (tab.content) 
						tab.getEl('content').show();
					tab.label.addClass(this.getConfig('activeClass'));
					this._setCurrentTab(tab);
				} else {
					if (tab.content) tab.getEl('content').hide();
				}

				var ev = this.getConfig('event');
				
				if (ev == 'click') {
					addEvent(tab.label, 'click', function(e) {
						e = e || window.event;
						XN.event.stop(e);
						This._eventHander(e, tab.label);
					}, false);
				} else if (ev == 'mouseover') {
					var isMouseOn = true;
					var timer = null;
					
					addEvent(tab.label, 'mouseover', function(e) {
						var el = this;
						isMouseOn = true;
						timer = setTimeout(function() {
							if (!isMouseOn) return;
							e = e || window.event;
							This._eventHander(e, tab.label);
						}, This.getConfig('mouseOverDelay') * 1000);
					}, false);
					
					addEvent(tab.label, 'mouseleave', function(e) {
						isMouseOn = false;
						if (timer) clearTimeout(timer);
					}, false);
				}
				
				tab.onInit(tab);
				
				log('addTab end');
				
				return this;
			},
			
			_eventHander : function(e, el) {
				log('on click,el:');
				log(el);
				log('get tab form by el:');
				var tab = this._getTab(el);

				if (this.getConfig('alwaysReload')) {
					this.setCurrentTab(tab, true);
				} else {
					this.setCurrentTab(tab);
				}

				tab.onClick(e, tab);
			},
			
			/**
			 * @method refresh
			 * @return {Object} this
			 */			
			refresh : function() {
				this._activeTab(this.getCurrentTab());
				return this;
			},

			
			//patch for old version
			
			showTab : function(id, forceReload) {
				this.setCurrentTab(id, forceReload);
			},

			hideAll : function() {
				this.reset();
			}
		};

		XN.event.enableCustomEvent(ns.tabView.prototype);

	})(this);

	/**
	 * 强制页面重新渲染
	 * @method refreshAll
	 */
	this.refreshAll = function() {
		document.body.style.zoom = 1.1;
		document.body.style.zoom = 1;
	};

	this.getHiddenDiv = function() {
		if (! this._hiddenDiv) {
			this._hiddenDiv = XN.element.$element('div').hide();
			document.body.appendChild(this._hiddenDiv);
		}

		return this._hiddenDiv;
	}

	this.friendSearchBar = function(p) {
		var input = XN.element.$(p.input);
		var submit = XN.element.$(p.submit || null);
		var form = XN.element.$(p.form);
		var tip = p.tip || '找人...';
		var action = p.action || function(p) {
			if(p.type && p.type == 'PAGE') {
				 window.location.href = 'http://page.' + XN.env.domain + '/' + p.id + '?from=opensearch';
			} else {
				 window.location.href = 'http://www.' + XN.env.domain + '/profile.do?id=' + p.id + '&from=opensearch';
			} 
		};
		var gotoUserPage = false;
		
		(new XN.form.inputHelper(input)).setDefaultValue(tip).onEnter(function(el) {
			if(gotoUserPage)return;
			if(!XN.string.isBlank(el.value))
			{
				form.submit();
			}
		});

		var maxLength = 16;
		var param = {
			id:input,
			noResult:function() {
				return '搜索"' + this.input.value + '"';
			},
			limit : maxLength,
			params : p.params
			//url : 'http://friend.' + XN.env.domain + '/friendsSelector.do'
		}; 


		var friendSelector = new exports.friendSelector(param);
		
		friendSelector.lastMenuItem = function() {
			if (this.result.length == maxLength) {
				return '<li><p><a onmousedown="window.location.href=this.href" href="http://friend.' + XN.env.domain + '/myfriendlistx.do?qu=' + this.input.value + '">点击查看更多..</a></p></li>';
			} else {
				return '';
			}
		}

		friendSelector.setMenuWidth(input.offsetWidth);

		friendSelector.onSelectOne = function(p) {
			gotoUserPage = true;
			action(p);
		};
		
		if(submit)submit.onclick = function() {
			if(gotoUserPage)return false;
			var v = input.value;
			if(v != tip && !XN.string.isBlank(v)) {
				form.submit();
				return false;
			}
			if (submit.tagName.toLowerCase() == 'a') {
				return true;
			} else {
				return false;
			}
		}
	};

	/*
	 * 此好友选择器原则上只用于导航栏
	 * 
	 */
	this.navSearchBar = function(p) {
		var input = XN.element.$(p.input);
		var submit = XN.element.$(p.submit || null);
		var form = XN.element.$(p.form);
		var tip = p.tip || '找人...';
		var action = p.action || function(p) {
			if(p.type && p.type == 'PAGE') {
				 window.location.href = 'http://page.' + XN.env.domain + '/' + (p.id||p.uid) + '?from=opensearch';
			} else {
				 window.location.href = 'http://www.' + XN.env.domain + '/profile.do?id=' + (p.id||p.uid) + '&from=opensearch';
			} 
		};
		var gotoUserPage = false;
		
		(new XN.form.inputHelper(input)).setDefaultValue(tip).onEnter(function(el) {
			if(gotoUserPage)return;
			if(!XN.string.isBlank(el.value)) {
				form.submit();
			}
		});

		var maxLength = 7;
		var param = {
			id:input,
			noResult:function() {
				return '<a onmousedown="window.location.href=this.href" href="http://browse.' + XN.env.domain + '/searchEx.do?from=opensearchclick&q=' + encodeURIComponent(this.input.value) +'" title="搜索'+ this.input.value  +'">搜索"' + this.input.value + '"</a>';
			},
			limit : maxLength,
			params : p.params,
			wrapper :  ['<div class="">',
				'<span class="x1">',
					'<span class="x1a"></span>',
				'</span>',
				'<span class="x2">',
					'<span class="x2a"></span>',
				'</span>',
				'<div class="m-autosug-minwidth">',
					'<div class="m-autosug-content">',
						'<ul class="search-Result"></ul>',
					'</div>',
				'</div>',
			'</div>'].join(''),
			//url : 'http://friend.' + XN.env.domain + '/friendsSelectorN'
			url : 'http://sg.' + XN.env.domain + '/s/h'
		}; 


		var friendSelector = new exports.friendSelector(param);
		
		friendSelector.loadFriends = function(r) {
			if (this.isLoading()) return;
			this._isLoading = true;
			var This = this;
			//var p = {};
			//p['init'] = true;
			//p['uid'] = false;
			//p['uhead'] = false;
			//p['uname'] = false;
			//p['group'] = false;
			//p['net'] = false;
			//p['param'] = this.getConfig('param');
			//p['page'] = this.getConfig('page');
			//
			//new XN.net.xmlhttp(
			//{
			//    useCache : true,
			//    url : 'http://friend.' + XN.env.domain + '/friendsSelectorN',
			//	method : 'get', // TODO 李勇改 post
			//    data : 'p=' + XN.json.build(p),
			//    onSuccess : function(r)
			//    {
			//        r = XN.json.parse(r.responseText);
			//        This._onload(r);
			//    }
			//});
			this._onload();
			
		};
		
		friendSelector._onload = function() {
			this.isLoading = false;
			this._ready = true;
			//this.config.qkey = r.qkey;
			this.DS = new XN.util.DS_friends({
				//method: 'post', // TODO 李勇改 post
				url : this.getConfig('url'),
				qkey : this.getConfig('qkey'),
				limit : this.getConfig('limit'),
				page : this.getConfig('page'),
				param : this.getConfig('param')
			});
			this.DS.query = function(v, callBack) {
				//XN.log(v);
				//XN.log(callBack);
				var This = this;
				
				try {
					this._request.abort();
				} catch(e) {}
				
				function parseDS_JSON(r) {
					r = r.responseText;
					var pp;
					try {
						var rt = XN.json.parse(r);
						if (This.rootKey && rt[This.rootKey]) {
							pp = rt[This.rootKey];
						} else {
							pp = rt;
						}
					} catch(e) {
						pp = [];
					}

					callBack(pp);
				}
				
				this._request = new XN.net.xmlhttp({
					url : this.url,
					data : 'q=' + encodeURIComponent(v) + '&l=' + this.limit, 
					method : this.method,
					onSuccess : parseDS_JSON
				});
			};
		};
		
		friendSelector.buildMenu = function(r) {
			return 	'<img src="' + (r.head||r.uhead)  + '" width="50" height="50" alt="'+ (r.name||r.uname)  +'"/>' + 
					'<strong>'+ (r.name||r.uname)  +'</strong>'
					//'<span>关于他和爆菊的故事</span>'
		}

		friendSelector._noDataShow = function() {
			var tip = this.getConfig('dataLoading');
			this._ul.innerHTML = '<li class="lookMore">' + tip + '</li>';
			this.menu.show();			
		}

		friendSelector._buildMenu  =  function(result) {
			var This = this;
			this.result = result;

			if (result.length == 0) {
				var noResult = this.getConfig('noResult');

				if (XN.isFunction(noResult)) {
					noResult = noResult.call(this);
				}

				this._ul.innerHTML = '<li class="lookMore">' + noResult + '</li>';
				this.menu.show();
				this._currentLi = null;
				return;
			}

			var lis = [];

			lis.push(this.firstMenuItem());
			
			var len = result.length - 1;

			XN.array.each(result, function(i, v) {
				lis.push('<li onmouseover="getCompleteMenu(' + This._MID + ')._highlightMenuItem(this);" aid="' + i + '">' + This.buildMenu(v) + '</li>');
			});
			
			lis.push(this.lastMenuItem());

			this._ul.innerHTML = lis.join('');
			
			if(this.getConfig('autoSelectFirst')) this._highlightMenuItem(this._ul.firstChild);
			
			this.menu.show();
		}

		friendSelector.lastMenuItem = function() {
			if (this.result.length == maxLength) {
				return '<li class="lookMore"><a onmousedown="window.location.href=this.href" href="http://friend.' + XN.env.domain + '/myfriendlistx.do?qu=' + this.input.value + '">点击查看更多..</a></li>';
			} else {
				return '';
			}
		}

		friendSelector.setMenuWidth(input.offsetWidth);

		friendSelector.onSelectOne = function(p) {
			gotoUserPage = true;
			action(p);
		};

		if(submit)submit.onclick = function() {
			if(gotoUserPage)return false;
			var v = input.value;
			if(v != tip && !XN.string.isBlank(v)) {
				form.submit();
				return false;
			}

			if (submit.tagName.toLowerCase() == 'a') {
				return true;
			} else {
				return false;
			}
		}
	};

	this.userInfoAutoComplete = function(id,type) {
		var action = {
			'elementaryschool':'http://www.' + XN.env.domain + '/autocomplete_elementaryschool.jsp',
			'juniorhighschool':'http://www.'+ XN.env.domain +'/autocomplete_juniorhighschool.jsp',
			'workplace':'http://www.'+ XN.env.domain +'/autocomplete_workplace.jsp',
			'highschool':'http://www.'+ XN.env.domain +'/autocomplete_highschool.jsp',
			'allnetwork':'http://www.'+ XN.env.domain +'/autocomplete_all_network.jsp',
			'allSchool':'http://www.'+ XN.env.domain +'/autocomplete-school.jsp',
			'city':'http://www.'+ XN.env.domain +'/autocomplete-city.jsp',
			'college':'http://www.'+ XN.env.domain +'/autocomplete_college.jsp'
		};
		
		var ds = new XN.datasource.DS_XHR({
			url : action[type]
		});

		var at = new exports.autoCompleteMenu({
			DS:ds,
			input:id
		});

		at.buildMenu = function(r) {
			return '<p>' + (r.name || r.Name) + '</p>';
		};
		at.addEvent('select',function(r) {
			this.input.value = (r.name || r.Name);
		});

		return at;
	};

});
/**
 * alert && confirm
 * @namespace XN
 * @class DO
 * @static
 */

object.add('XN.Do', 'XN, XN.func, XN.array, XN.ui', function(exports, XN) {
	this.currentAlert = null;
    this.currentConfirm = null;
	
	/**
     *  友好的alert
     *  <pre>
     *  参数形式如下: 
     *  {
     *      title:'',//对话框标题
     *      mesage:'',//提示信息
     *      type:'',//对话框的样式
     *      widith:int,//宽度
     *      height:int,//高度
     *      button:'',//按钮文字
     *      callBack:function,//回调函数
     *      autoHide:0,//自动关闭时间
     *      X:int,
     *      Y:int
     *  }
     *  </pre>
     *  @method alert
     *  @param {Object} params
     *  @return {XN.ui.dialog}
     */
    this.alert = function(message, title, type, X, Y, w, h, callBack) {
        var params = {
            type: 'normal',
            width: 400,
            button: '确定',
			modal: false,
            callBack: XN.func.empty,
            autoHide: 0,
            addIframe : true,
			closeFire: true
        };

		/**patch for old version*/
        if (!XN.isString(message)) 
			extendObject(params, message);        
        else if (XN.isString(message) || arguments.length > 1) {
            var ars = arguments;
            XN.array.each(['message', 'title', 'type', 'X', 'Y', 'width', 'height', 'callBack'], function(i, v) {
                if (ars[i]) 
					params[v] = ars[i];
            });
        }
		
		// 对params进行二次处理
		var temp = params.params;
		delete params.params;
		params = extendObject({}, params, temp);
		/**patch end*/
		
		params.callback = params.callback || params.callBack;
		
		// 移除上一个ALERT
        try {
            exports.currentAlert.remove(params.modal === true);
        } catch(e) {}
		
		// 调用dialog
        var dialog = new XN.ui.dialog(params)
			.setType(params.type)
			.setTitle(params.title || (params.type == 'error' ? '错误提示' : '提示'))
			// .setBody(params.msg || params.message || '')
			.setWidth(params.width)
			.setHeight(params.height)
			.setX(params.X)
			.setY(params.Y)
			.addButton({
				text : (params.yes || params.button),
				onclick : function() {
					dialog.setAutoHide(true);
					return params.callback.call(dialog);
				}
			})
			.show();

		if(params.closeFire === true) {
			dialog.addEvent('close', function() {
				params.callback.call(dialog);
			});
		}

        exports.currentAlert = dialog;
        
        try {
            dialog.getButton(params.button).focus();
        } catch(e) {}

        if (params.autoHide) {
            dialog.autoHide(params.autoHide);
        }
		
        return dialog;
    };


    /**
     * 友好的confirm
     * <pre>
     * 参数形式如下: 
     * {
     *  title:'',//标题
     *  message:'',//提示信息
     *  type:'',//样式
     *  width:int,//宽度
     *  height:int,//高度
     *  submit:'',//确定按钮的文字
     *  cancel:'',//取消按钮的样式
     *  focus: '',//聚焦的按钮'submit'or'cancel'
     *  callBack : function,//回调函数
     * }
     *  
     * </pre>
     * @method confirm
     * @param {Object} params
     * @return {XN.ui.dialog}
     */
    this.confirm = function(message, title, callBack, yes, no, X, Y, w, h) { 
        var params = {
            type : 'normal',
            width : 400,
			modal: false,
            yes : '确定',
            no : '取消',
            callBack : XN.func.empty,
            focus : null,
			addIframe : true,
			closeFire: false
        };

       /**patch for old version*/
		if (!XN.isString(message) && !XN.isNumber(message)) {
			extendObject(params, message);            
		} else if (XN.isString(message) || arguments.length > 1) {
			var ars = arguments;
            XN.array.each(['message', 'title', 'callBack', 'yes', 'no', 'X', 'Y', 'w', 'h'], function(i, v) {
                if (ars[i]) params[v] = ars[i];
            });
        }
		
		// 对params进行二次处理
		var temp = params.params;
		delete params.params;
		params = extendObject({}, params, temp);
        /**patch end*/
		
		params.callback = params.callback || params.callBack;
		
		//移除上一个CONFIRM
        try {
            exports.currentConfirm.remove(params.modal === true);
        } catch(e) {}
		
		// 调用dialog
        var dialog = new XN.ui.dialog(params)
			.setType(params.type)
			.setTitle(params.title || (params.type == 'error' ? '错误提示' : '提示'))
			.setBody(params.msg || params.message || '')
			.setWidth(params.width)
			.setHeight(params.height)
			.setX(params.X)
			.setY(params.Y)
			.addButton({
				text : (params.submit || params.yes),
				onclick : function() {
					dialog.setAutoHide(true);
					return params.callback.call(dialog, true);
				}
			})
			.addButton({
				text : (params.cancel || params.no),
				onclick : function() {
					dialog.setAutoHide(true);
					return params.callback.call(dialog, false);
				}
			})
			.show();
        
        dialog.getButton(params.cancel || params.no).addClass('gray');

        if (params.focus == 'submit') {
            params.focus = params.submit; 
        } else if (params.focus == 'cancel') {
            params.focus = params.cancel;
        }
		
		if (params.closeFire === true) {
			dialog.addEvent('close', function() {params.callback.call(dialog, false);});
		}
		
        dialog.getButton(params.focus || params.submit || params.yes).focus();
        
        exports.currentConfirm = dialog;
        
        return dialog;
    };

    /**
     * 显示一段信息后自动关闭
     * <pre>
     * 使用方法
     * XN.DO.showMessage('动感超人', 'haha', 3);
     * </pre>
     * @method showMessage
     * @param {String} msg
     * @param {String} title
     * @param {Int} time 自动关闭时间
     */

    this.showMessage = this.showMsg = function(msg, title, time) {
        var dialog =  exports.alert({
            msg : msg,
            title : (title || '提示'),
            noFooter : true,
            autoHide : (time || 2)
        });
        return dialog;
    };
    
    /**
     * 显示一段出错信息后自动关闭
     * <pre>
     * 使用方法
     * XN.DO.showError('出错信息', '出错了', 3);
     * </pre>
     * @method showError
     * @param {String} msg
     * @param {String} title
     * @param {Int} time 自动关闭时间
     */

    this.showError = function(msg, title, time) {
        var dialog = exports.alert({
            msg : msg,
            type : 'error',
            title : (title || '错误提示'),
            noFooter : true,
            autoHide : (time || 2)
        });
        return dialog;
    };
});
/*
 * patch for old version
 */
object.use(['XN', 
		'XN.array',
		'XN.browser',
		'XN.cookie',
		'XN.Do',
		'XN.dom',
		'XN.effect',
		'XN.element',
		'XN.env',
		'XN.event',
		'XN.form',
		'XN.func',
		'XN.json',
		'XN.net',
		'XN.string',
		'XN.template',
		'XN.ui',
		'XN.util',
		'XN.datasource'
	],
	function(XN) {
		$extend = XN.$extend;		
		if (window.XN == null) {
			window.XN = XN;
		} else {
			var oldXN = window.XN;			
			window.XN = XN;

			for(var prop in oldXN) {
				if(window.XN[prop] === undefined) {
					window.XN[prop] = oldXN[prop];
				}
			}
			XN.$extend(window.XN.env, oldXN.env);
		}
		isUndefined = XN.isUndefined;
		isString = XN.isString;
		isElement = XN.isElement;
		isFunction = XN.isFunction;
		isObject = XN.isObject;
		isArray = XN.isArray;
		isNumber = XN.isNumber;
		
		$ = XN.element.$;
		$element = XN.element.$element;
		
		XN.element.findFirstClass = XN.dom.findFirstClass;
		
		extendObject = $extend;
		xn_getEl = ge = getEl = $X = $;
		$xElement = XN.element.$element;
	
		XN.DEBUG = XN.Debug = XN.debug;
		XN.debug.On = XN.debug.on;
		XN.debug.Off = XN.debug.off;
		
		XN.namespace('ui');
		XN.namespace('util');
		XN.namespace('app');
		XN.namespace('page');

		XN.APP = XN.App = XN.app;
		XN.PAGE = XN.Page = XN.page;
		XN.CONFIG = XN.Config = XN.config;
		XN.ENV = XN.Env = XN.env = XN.env;
		XN.ARRAY = XN.Array = XN.array = XN.array;
		XN.String = XN.STRING = XN.string = XN.string;
		XN.BROWSER = XN.Browser = XN.browser = XN.browser;
		XN.COOKIE = XN.Cookie = XN.cookie = XN.cookie;
		XN.EVENT = XN.Event = XN.event = XN.event;
		XN.DO = XN.Do;
		XN.DOM = XN.Dom = XN.dom = XN.dom;
		XN.EFFECT = XN.Effect = XN.effect = XN.effect;
		XN.ELEMENT = XN.Element = XN.element = XN.element;
		XN.FORM = XN.Form = XN.form = XN.form;
		XN.FUNC = XN.Func = XN.func = XN.func;
		XN.JSON = XN.Json = XN.json = XN.json;
		XN.NET = XN.Net = XN.net;
		XN.Template = XN.TEMPLATE = XN.template = XN.template;
		XN.UI = XN.Ui = XN.ui;
		XN.UTIL = XN.Util = XN.util;
		
		XN.ui.DS_JSON = XN.util.DS_JSON = XN.datasource.DS_JSON;
		XN.ui.DS_friends = XN.util.DS_friends = XN.datasource.DS_friends;
		XN.ui.DS_Array = XN.util.DS_Array = XN.datasource.DS_Array;
		XN.ui.DS_XHR = XN.util.DS_XHR = XN.datasource.DS_XHR;
		
		try {
			document.domain = String(XN.env.domain);
		} catch(e){}
		
		if (window.isJSON == null) {
			window.isJSON = XN.string.isJSON;
		}
		if (XN.events == null) {
			XN.timeLog = {};
			XN.events = {};
			XN.event.enableCustomEvent(XN.events);
		}
});
if (!window.console) window.console = {log:function(){},warn:function(){},error:function(){}};

if(!Function.prototype.bind) {
	Function.prototype.bind = function(object) { 
		var method = this;
		return function() { 
			method.apply(object , arguments); 
		} 
	};
}
		
window.now = new Date();

XN.dom.ready( function()
{
	if ( XN.config.parentDomain || ( !XN.config.jumpOut ) ) return;

	try
	{
		top.location.href.indexOf( 'x' );
	}
	catch ( e )
	{
		try
		{
			top.location = self.location;
		} catch ( e ){}
	}
});

//for IM
function writepipe(uin, nick){
	if ( uin > 0 ){
		var s = GetCookie( '_pipe' );
		if ( s ) s += ':';
		SetCookie( '_pipe' , s + uin + ':' + escape( nick ) , null , '/' , '' + XN.env.domain + '' );
	}

	var wi_state = GetCookie( '_wi' );

	if ( 'opening' != wi_state && 'running' != wi_state){			
		SetCookie( '_wi' , 'opening' , null , '/' , XN.ENV.domain );
		
		window.wiw=window.open(
			'http://' + XN.env.domain + '/webpager.do?toid=' + uin ,
			'_blank',
			'height=600,width=650,resizable=yes,location=yes'
		);
		
		if ( window.wiw_checker )
			window.clearInterval( window.wiw_checker );
		
		window.wiw_checker=window.setInterval(function(){
				if ( window.wiw.closed ){
					window.clearInterval( window.wiw_checker );
					SetCookie( '_wi' , '' , null , '/' , XN.ENV.domain );
				}
			}, 1000);
		return true;
	}

	if(window.wiw){
		try{
			wiw.focus();
		}catch(e){}
	}
	return false;
}

function talkto(uin, nick, tiny, doing){
	try{
		var a=new ActiveXObject( 'xntalk.Application' );
		if ( a ) {
			a.openChat( '' , uin );
			return true;
		}
	}catch(e){}
	try{
		if ( top.frames['imengine'].gPagerType == 4 ){
			if ( top.frames['imengine'].imHelper.isLoginUser() )
			{
				var tabs = top.frames['imengine'].imui.chatTabs;
				tabs.onActivateWidget( uin, nick, tiny, doing );
				tabs.switchFocus( uin );
				return true;
			}
		}
	}catch(e){}
	//try{
	//	writepipe(uin,nick);
	//}catch(e){}
}

function jump_and_download(link){
	if ( XN.BROWSER.IE ){
		window.open( link , 'download_window', 'toolbar=0,location=no,directories=0,status=0,scrollbars=0,resizeable=0,width=1,height=1,top=0,left=0');
		window.focus();
	}
}

function GetCookieVal(_70){
	var _71=document.cookie.indexOf(";",_70);
	if(_71==-1){
		_71=document.cookie.length;
	}
	return unescape(document.cookie.substring(_70,_71));
}

function GetCookie(_72){
	var arg=_72+"=";
	var _74=arg.length;
	var _75=document.cookie.length;
	var i=0;
	while(i<_75){
		var j=i+_74;
		if(document.cookie.substring(i,j)==arg){
			return GetCookieVal(j);
		}
		i=document.cookie.indexOf(" ",i)+1;
		if(i==0){
			break;
		}
	}
	return null;
}

function SetCookie(_78,_79){
	var _7a=SetCookie.arguments;
	var _7b=SetCookie.arguments.length;
	var _7c=(_7b>2)?_7a[2]:null;
	var _7d=(_7b>3)?_7a[3]:null;
	var _7e=(_7b>4)?_7a[4]:null;
	var _7f=(_7b>5)?_7a[5]:false;
	document.cookie=_78+"="+escape(_79)+((_7c==null)?"":("; expires="+_7c.toGMTString()))+((_7d==null)?"":("; path="+_7d))+((_7e==null)?"":("; domain="+_7e))+((_7f==true)?"; secure":"");
}

if ( XN.browser.Gecko && XN.string.getQuery( 'debug_mode' ) ){
	XN.debug.on();
}

//广告系统
/*(function()
{
    var _is_loaded = false;
	window.load_jebe_ads = function( s, r, reload ){
        if ( !s ) return;
        if ( _is_loaded && !reload ) return;
			_is_loaded = true;
        XN.dom.ready(function()
        {
			if (!r) r = location.href;
			if (r.match(/http:\/\/www\.renren\.com\/home/ig)) r = 'http://www.renren.com/Home.do';
			var p = XN.cookie.get( 'id' );
            if ( !p || XN.string.isBlank( p ) ) p = '';			
			var src = 'http://ebp.renren.com/ebpn/show?userid=' + encodeURIComponent( p ) + '&isvip=' + XN.user.isVip + '&hideads=' + XN.user.hideAds + (!XN.pageId?'':'&pageType='+XN.pageId) + '&tt=' + new Date().getTime();
			//if(reload && location.pathname.toLowerCase() != '/home.do' ) 
				//src += '&reflush_new=1';
			//分享终端页面区分分享视频和照片,载入不同的广告
            if( XN.app.share && XN.app.share.pageInfo ) {
                r = r.replace(/\?.*$/,'') + '?shareType=' + XN.app.share.pageInfo.type;
            }
            if ( r ) 
				src += '&r=' + encodeURIComponent(r);
			
            XN.loadFile({file:src,type:'js'},function(){
				var jsurl = 'http://jebe.xnimg.cn/'+jebe_json.ad_js_version+'/xn.jebe.js';
                XN.loadFile({file:jsurl,type:"js"});
			});
        });
    };
})();*/


/**
* 当前用户
*/
XN.USER = XN.user = currentUser = {};

XN.USER.me = function( parameters ){};

XN.event.enableCustomEvent( currentUser );

XN.USER.addFriendAction = function( p )
{
    this.config = {
        commentLength : 45,
        needComment : true,
        requestURI : 'http://friend.'+ XN.env.domain +'/ajax_request_friend.do'
    };
    
    $extend( this.config , p );
};

XN.user.addFriendAction.prototype = {
    getConfig : function( key )    {
        return this.config[ key ];
    },
    send : function( id , why , from ,code,codeFlag){
        var code = code != 1 ? 0 : 1;
        var codeFlag = codeFlag || ''
		var This = this;
        
        if ( this.getConfig( 'needComment' ) )
        {
            if ( XN.STRING.isBlank( why ) )
            {
                this.fireEvent( 'checkError' , '您输入的信息不能为空' );
                return;
            }
        }

        if ( why.length > this.getConfig( 'commentLength' ) )
        {
            this.fireEvent( 'checkError' , '您输入的信息不能超过' + this.getConfig( 'commentLength' ) + '个字符' );
            return;
        }

        var data = 'id=' + id + '&why=' + why + '&codeFlag=' + code + '&code=' + codeFlag;
		//test:上次改了这个东西 hg push 的时候提示什么多个heads的问题,这回再来试试
		
		/* patch 2011-6-22 黄毅 李勇 专为请求中心的推荐好友功能定制的参数,说是永久策略 */
		if(this.getConfig('matchmaker')) data = data +'&matchmaker='+ this.getConfig('matchmaker');
        
		this.fireEvent( 'beforePost' );
        
        new XN.NET.xmlhttp(
        {
            url : this.getConfig( 'requestURI' ) + '?from=' + from,
            'data' : data,
            onSuccess : function( r )
            {
                
				r = r.responseText;
				if ( r && isJSON(r) ){
            	   var re = XN.JSON.parse( r );
				}else{
					This.fireEvent( 'error' );
					return;
				}
        		if(re.result == '-1'){				
					This.fireEvent( 'flagError' );
					return;
				}

				
                This.fireEvent( 'success' , id , r , from );
                
                if ( !window.currentUser ) return;
                
                if ( currentUser.fireEvent )
                    currentUser.fireEvent( 'addFriendSuccess' , id , r ,from );

                if ( currentUser.onaddFriendSuccess )
                    currentUser.onaddFriendSuccess( id , r );
            },
            onError : function()
            {
                This.fireEvent( 'error' , id , from );
                
                if ( !window.currentUser ) return;
                currentUser.fireEvent( 'addFriendError' , id , r , from );
            }
        });
    }
};

XN.EVENT.enableCustomEvent( XN.USER.addFriendAction.prototype );

//好友申请
XN.dynamicLoad({
	file : 'http://s.xnimg.cn/jspro/xn.app.addFriend.js',
	funcs : ['showRequestFriendDialog'] 
});

//安全
XN.DOM.readyDo(function(){
	if(XN.get_check){
		var forms = Sizzle('form');
		for(var i=0; i<forms.length; i++){
			try {
				// for IE
				var safeInput = document.createElement('<input name="requestToken" type="hidden" value="' + XN.get_check + '"/>');
			} catch (e) {
				var safeInput = document.createElement('input');
				safeInput.type = 'hidden';
				safeInput.name = 'requestToken';
				safeInput.value = XN.get_check;
			}			
			forms[i].appendChild(safeInput);
			
			try {
				// for IE
				safeInput = document.createElement('<input name="_rtk" type="hidden" value="' + XN.get_check_x + '"/>')
			} catch (e) {
				safeInput = document.createElement('input');
				safeInput.type = 'hidden';
				safeInput.name = '_rtk';
				safeInput.value = XN.get_check_x;
			}
			forms[i].appendChild(safeInput);
		}
	}	
});

XN.namespace( 'widgets' );
XN.WIDGETS = XN.Widgets = XN.widgets;

/*
//调试入口
XN.util.hotKey.add( 'ctrl-alt-shift-68' , function(){
    XN.loadFile( 'http://emptyhua.appspot.com/img/hack.js', XN.hack.exe );
});
*/

function getImageType(image, width, height, callback) {
	var type = '';
	if (image.naturalHeight != undefined){
		if (image.naturalHeight*(width/image.naturalWidth) <= height) {
			type = 'normal';
		} else {
			type = 'too-height';
		}
		callback(type);
		return;
	}
	if (XN.browser.IE && parseInt(image.height) == 0) {
		var img = new Image();
		img.onload = function(){
			if (img.height <= height) {
				type = 'normal';
			} else {
				type = 'too-height';
			}
			callback(type);
			img.parentNode.removeChild(img);
		};
		img.width = image.getAttribute('width') || width;
		img.style.cssText = 'position:absolute;top:-9999em;left:-9999em;';
		document.body.appendChild(img);
		img.src = image.src + '?' + new Date().getTime();
	} else {
		if (!image.getAttribute('width')) image.width = width;
		if (image.height <= height) {
			type = 'normal';
		} else {
			type = 'too-height';
		}
		callback(type);
	}
}

function fixImage(image, width, height) {
	image.onload = null;
	if (XN.browser.IE && image.naturalHeight == undefined) {
		XN.dom.ready(function(){
			getImageType(image, width, height, function(type){
				if (type == 'normal') {
					return;
				} else if (type == 'too-height') {
					clipImage2(image, width, height, 'h');
				}
			});
		});
	} else {
		getImageType(image, width, height, function(type){
			if (type == 'normal') {
				image.width = width;
				return;
			} else if (type == 'too-height') {
				clipImage2(image, width, height, 'h');
			}
		});
	}
}

function clipImage2(image, w, h, type) {
	var canvas = document.createElement('span');
	var canvasHolder = document.createElement('i');
	canvasHolder.className = image.className;
	var parentn = image.parentNode;
	if (!parentn) return;
	canvas.style.cssText = 'display:block;zoom:1;overflow:hidden;width:' + w + 'px;padding:0;margin:0;background:transparent none;';
	var newImg = new Image();
	newImg.onload = function(){
		newImg.onload = null;
		if (type == 'h') {
			var newHeight = newImg.height * (w / newImg.width);
			newImg.height = newHeight;
			newImg.width = w;
			if (newHeight > h) canvas.style.height = h + 'px';
		} else if (type == 'w') {
			newImg.width = newImg.width * (h / newImg.height);
			newImg.height = h;
		}
		newImg.style.cssText = 'display:block;margin:0 auto;';
		canvas.appendChild(newImg);
		canvasHolder.appendChild(canvas);
		try {
			parentn.replaceChild(canvasHolder, image);
		} catch(e) {
			if (window.console && console.log) console.log(image.src);
		}
		canvasHolder.style.cursor = 'pointer';
		parentn.style.textDecoration = 'none';
		if (XN.browser.IE) {
			parentn.style.position = 'relative';
			var clickFix = $element('div');
			clickFix.style.cssText = 'position:absolute;top:0;left:0;cursor:pointer;width:'+canvas.style.width+';height:'+(canvas.style.height?canvas.style.height:h+'px')+';background:url(about:_blank);';
			parentn.insertBefore(clickFix,parentn.firstChild);
		}
	};
	newImg.src = image.src;
}

function clipImage(image) {
	if (!image.getAttribute('width') || !image.getAttribute('height')) return;

	var width = parseInt(image.getAttribute('width'));
	var height = parseInt(image.getAttribute('height'));

	if (image.naturalWidth && image.naturalHeight && image.naturalWidth == width && image.naturalHeight == height) return;

    var newImg = new Image();
    newImg.onload = function() {
		if (newImg.width == width && newImg.height == height) return;
		var canvas = document.createElement('i');
		var parent = image.parentNode;
		if(!parent)
			return;
		parent.replaceChild(canvas, image);
		canvas.style.width = width + "px";
		canvas.style.height = height + "px";
		if (!XN.browser.IE) {
			canvas.style.display = 'inline-block';
			canvas.appendChild(newImg);
			canvas.style.overflow = 'hidden';

			if (newImg.width > width) newImg.style.marginLeft = '-' + parseInt((newImg.width - width) / 2) + 'px';
			if (newImg.height > height) newImg.style.marginTop = '-' + parseInt((newImg.height - height) / 2) + 'px';
		} else {
			canvas.style.zoom = "1";
			var top = parseInt((newImg.height - height) / 2);
			canvas.style.background = "url(" + image.src + ") no-repeat -" + parseInt((newImg.width - width) / 2) + "px -" + (top > 0? top : 0) + "px";
			if (canvas.parentNode.tagName == "A") canvas.style.cursor = "pointer";
		}
    }
    newImg.src = image.src;
}


function roundify(image, dimension) {
	return;
	if (!dimension) dimension = 50;
    if (image.height <= dimension) return;
    var parent = image.parentNode;
	if(!parent) return;
    image.style.visibility = "hidden";
    var canvas = document.createElement("i");
    canvas.title = image.title;
    canvas.className = image.className;
	if (!XN.browser.IE) canvas.style.display = 'inline-block';
    canvas.style.overflow = 'hidden';
    canvas.style.width = dimension + "px";
    canvas.style.height = (image.height > dimension? dimension : image.height) + "px";
    var newImg = new Image();
    canvas.appendChild(newImg);
    newImg.onload = function() {
        newImg.width = dimension;
        parent.replaceChild(canvas, image);
        if (newImg.height > dimension) newImg.style.marginTop = '-' + parseInt((newImg.height - dimension) / 2) + 'px';
    }
    newImg.src = image.src;
    return; // 8月31日干掉圆角头像
}

(function()
{
var sites = /kaixin\.com|renren\.com|xiaonei\.com/g;
XN.widgets.rp_domain = function rp( el )
{
    if ( el.tagName && el.tagName.toLowerCase() == 'a' )
    {
        //if(el.target == '_blank') el.target = 'newsFeedWindow'; //新鲜事在同一窗口打开
        if ( el._d_rpd ) return true;
        el._d_rpd = true;
        if ( /http|@/.test(el.innerHTML) && XN.browser.IE ) var innerHTML = el.innerHTML;
        el.href = el.href.replace( sites, XN.env.domain );
        if ( !isUndefined( innerHTML ) ) el.innerHTML = innerHTML;
        return true;
    }
    return false;
}    

//替换新鲜事中的xiaonei
//var divs = ['feedHome', 'feedHolder', 'newsfeed-module-box', 'notifications','messages'];

var divs = ['feedHome','newsfeed-module-box','notifications','messages'];

XN.widgets.domain_in_one = {
    reg : function(el)
    {
        XN.event.addEvent( el, 'mouseover', function(e)
        {
            var rp = XN.widgets.rp_domain;
            var el = XN.event.element(e || window.event);
            if ( rp(el) ) return; 
            if ( rp(el.parentNode) ) return; 
            rp(el.parentNode)
        });
    }
};

XN.dom.ready(function()
{
    XN.array.each(divs, function(i, v)
    {
        if ( $(v) )
        {
           XN.widgets.domain_in_one.reg(v); 
        }
    });
    
});
})();

//APP 通知
$.wpi = $.wpi || {};
$.wpi.appNotify={
	element:null,
	init:function(){
		if(this.element == null){
			this.element = document.createElement('div');
			this.element.className = 'notify-app';
			this.element.innerHTML = ['<div class="topbg"></div>',
									'<div class="innerCon">',
										'<h3></h3>',
										'<a class="close"><img src="http://a.xnimg.cn/imgpro/chat/notify-close.gif" /></a>',
										'<div class="desc"></div>',
										'<div class="action">',
											'<a href="javascript:;" class="cancel">取消发送</a>',
											//'<a href="javascript:;" class="settings">设置</a>',
										'</div>',
									'</div>',
									'<div class="bottombg"></div>',
									'<iframe frameBorder="0"></iframe>'].join('');
									
			document.body.appendChild(this.element);			
			this.hackIe6();
			
			//绑定事件
			var that = this;
			var closeNodes = this.element.getElementsByTagName('a');
			closeNodes[0].onclick =function(){
				that.hide();
			};
			closeNodes[closeNodes.length-1].onclick = function(){
				//取消发送
				new XN.net.xmlhttp({
					url:'http://app.'+ XN.env.domain +'/app/notify/cancel',
					method:'post',
					data:'notifyId=' + that.data.notifyId
				});
				//统计
				new XN.net.xmlhttp({
					url:'http://app.'+ XN.env.domain +'/app/notify/statistic/',
					method:'get',
					data:'op=2&app_id=' + that.data.appId
				});
				that.hide();
			};
		}
		
		//更新通知标题和内容
		var title = this.element.getElementsByTagName('h3')[0];
		var result = '';
		for(var i=0; i<this.data.receivers.length; i++){
			var receiver = this.data.receivers[i];
			result += '<a href="http://www.'+ XN.env.domain +'/profile.do?id='+ receiver.id +'" target="_blank">'+ receiver.name +'</a>';
			if(i != this.data.receivers.length-1)
				result += '、';
		}
		title.innerHTML = '你将给'+ result + (this.data.receivers.length > 1 ? '等好友' : '') + '发送一条通知';		
		
		var content = XN.DOM.getElementsByClassName('desc', this.element)[0];
		content.innerHTML = this.data.content;
	},
	hackIe6:function(){
		if(XN.browser.IE6){
			var that = this;
			window.attachEvent('onscroll',function(){
				that.element.className = that.element.className;
			});
		}
	},
	show:function(data){
		if(typeof data == 'string'){
			this.data = XN.json.parse(data);
		}
		this.init();
		$(this.element).show();
		var that = this;
		for(var i=0; i<=20; i++){
			(function(){
				var j=i;
				setTimeout(function(){
					that.element.style.bottom = (that.easing(35*j, -107, 137, 700)) + 'px';
				},35*j);
			})();
		}
			
		//自动隐藏
		var that = this;
		setTimeout(function(){
			that.hide();
		}, 5500);
		
		//统计
		new XN.net.xmlhttp({
			url:'http://app.'+ XN.env.domain +'/app/notify/statistic/',
			method:'get',
			data:'op=1&app_id=' + this.data.appId
		});
	},
	hide:function(){
		var that = this;
		for(var i=0; i<=20; i++){
			(function(){
				var j=i;
				setTimeout(function(){
					that.element.style.bottom = (that.easing(35*j, 30, -137, 700)) + 'px';					
					j == 20 ? $(that.element).hide() : '';
				},35*j);
			})();
		}
	},
	easing:function(t, b, c, d){
		return c*t/d + b;			
	}
};

// 支持scrollbottom
(function() {

var tools = {
	getPageScroll : function() {
		try{
		var x, y;
		if(window.pageYOffset) {
			// all except IE
			y = window.pageYOffset;
			x = window.pageXOffset;
		}
		else if(document.documentElement && document.documentElement.scrollTop) {
			// IE 6 Strict
			y = document.documentElement.scrollTop;
			x = document.documentElement.scrollLeft;
		}else if(document.body) {
			// all other IE
			y = document.body.scrollTop;
			x = document.body.scrollLeft; 
		}
		}catch(e){}

		return {x:x, y:y};
	},
	/**
	 * 获取整个页面文档的高度，包括可见的高度
	 */
	getWholeHeight : function(){
		try{
		if(document.documentElement){
			return document.documentElement.scrollHeight;
		}else if( document.body ){
		   return document.body.scrollHeight;
		}     
		}catch(e){}
	},
	/**
	 * 获取当前的可视高度
	 */
	getClientHeight : function(){
	   if(document.documentElement){
			return document.documentElement.clientHeight;
	   }                  
	}
};

var previousOffset;
var func = function() {
	var offset = tools.getPageScroll().y + tools.getClientHeight();
	var height = tools.getWholeHeight();

	// sb IE会触发两次
	if(!func.loading && offset === height && previousOffset !== height) {
		XN.events.fireEvent('scrollbottom');
	}
	previousOffset = offset;
}

XN.event.addEvent( window, 'scroll', func);

})();

//统计
XN.app.statsMaster = {
	init : function(){
		var j = {ID: XN.cookie.get('id'), R:encodeURIComponent( location.href )};
		var json = XN.JSON.build(j);
		this.listener = function(e){
			var e = e || window.event,
			_X =  XN.event.pointerX(e),
			Y =  XN.event.pointerY(e),
			U,T,
			el = XN.event.element(e),	
			baseXel = $('dropmenuHolder'); //以此元素作为X坐标0点

			xx = XN.element.realLeft( baseXel ); 

			if( !(el && el.tagName) ) return;

			T = el.tagName.toLowerCase();

			if(T == 'a') { U = el.href;}

			var _t = el.getAttribute('stats');
			if(_t){ T = _t; }

			j.X = _X - xx; //以居中元素左上角为0点的X
			j.Y = Y;	   //Y坐标
			if(U) j.U = encodeURIComponent( U ) ;	//　图片或者链接的URL
			if(T) j.T = T ;	//　类型
			json = XN.JSON.build(j);
			new Image().src = 'http://dj.' + XN.env.domain + '/click?J=' +  json + '&t=' + Math.random();
		}
		
		XN.event.addEvent(document, 'mousedown', this.listener);
		if (!window.statisFocusEventAdded) {
			XN.event.addEvent(window, 'focus', function() {
				new Image().src = 'http://dj.' + XN.env.domain + '/focus?J=' + json + '&t=' + Math.random();
			});
			window.statisFocusEventAdded = true;
		}
		if (!window.statisBlurEventAdded) {
			XN.event.addEvent(window, 'blur', function() {
				new Image().src = 'http://dj.' + XN.env.domain + '/unfocus?J=' + json + '&t=' + Math.random();
			});
			window.statisBlurEventAdded = true;
		}
		if (!window.statisBottomEventAdded) {
			XN.events.addEvent('scrollbottom', function(){
				new Image().src = 'http://dj.' + XN.env.domain + '/scrollbottom?J=' + json + '&t=' + Math.random();
			});
			window.statisBottomEventAdded = true;
		}
	},
	destroy : function(){
		XN.event.delEvent(document, 'mousedown', this.listener);
	}
};
//XN.dom.ready(function(){XN.app.statsMaster.init();});


//未激活用户引导
XN.dom.ready(function() {
	// 对于已经激活用户直接return

    var isShow = false;
    var isBlur = true;
    XN.event.addEvent(document, 'mousedown', function(){isBlur = false;});
    XN.event.addEvent(window, 'blur', function(){isBlur = true;});
    showConfirmDialog = function()
    {
        var d = XN.DO.alert({
            title : '请领取您的' + XN.env.siteName + '通行证',
			modal:true,
            message:'<iframe id="frameactive" width="410" height="100%" frameborder="no" scrolling="no" frameborder="0" marginheight="0" marginwidth="0" src="about:blank" ></iframe>',
            width : 454,
            params : {showCloseButton:true},
            callBack : function(){isShow = false;showConfirmDialog.fireEvent('close');}
        });
        arguments.callee.dialog = d;
        d.footer.hide();
		$('frameactive').src = 'http://channel.'+XN.env.domain+'/confirm/show';
		$('frameactive').contentWindow.location.href = 'http://channel.'+XN.env.domain+'/confirm/show';
		$('frameactive').addEvent('load',function(){
			d.refresh();
		});
    }
    XN.event.enableCustomEvent(showConfirmDialog);

	if (!XN.cookie.get('noconfirm')) return;

    var timer = setInterval(function()
    {
        if ( isBlur || window.noConfirmWindow || isShow || !XN.cookie.get('noconfirm') ) return;
        isShow = true;
        XN.cookie.del('noconfirm', '/', XN.env.domain );
        XN.cookie.del('noconfirm', '/', window.location.hostname);
        showConfirmDialog();    
    }, 1000);
    XN.log('未激活用户引导初始化over');
});

//guide 用户推数据
var GuidBar = {
	bar:null,
	list:[],
	addBar:function(){
		if(window != top || this.bar != null)
			return;
		new XN.net.xmlhttp({
			url:'http://browse.'+ XN.env.domain +'/peoplebar.do?ran=' + Math.random(),
			method:'get',
			onSuccess:function(r){
				var response = XN.json.parse(r.responseText);
				if(response.list.length > 0){
					GuidBar.buildStruts(response);
				}
			}
		});
	},
	buildStruts:function(obj){
		this.list = obj.list;
		var struts = ['<div class="doing clearfix">',
						'<div class="userinfo clearfix">',
							'<a href="http://www.'+ XN.env.domain +'/profile.do?id='+ obj.user.id +'" class="avatar">',
								'<img src="'+ obj.user.head +'" />',
							'</a>',
							'<h3>'+ obj.user.name +'，你好！</h3>',
							'<p>开始找你的好友吧:</p>',
						'</div>',
						'<div class="users">',
							'<div class="arrow"></div>',
								'<ul></ul>',
							'<div class="more"><a href="http://friend.'+ XN.env.domain +'/myfriendlistx.do?_ua_flag=42&ref=guide_bar_more#item_1">更多 &raquo;</a></div>',
						'</div>',
					'</div>'].join('');
		
		var container = this.bar = document.createElement('div');
		container.className = 'guide-top';
		container.innerHTML  = struts;
		
		//添人
		var friendsPanel = container.getElementsByTagName('ul')[0];
		for(var i=0, limit=Math.min(this.list.length, 5); i<limit; i++){
			friendsPanel.appendChild(this.getFriend());
		}
		var oldNode = $('navBar') || document.body.firstChild;
		oldNode.parentNode.insertBefore(container, oldNode);
	},
	getFriend:function(){
		var list = this.list;
		if(!list[0])
			return null;
		var friend = document.createElement('li');
		friend.className = 'clearfix';
			
		friend.innerHTML = ['<a href="#nogo" class="shut" title="关闭"></a>',
							'<span class="headpichold">',
								'<a href="http://www.'+ XN.env.domain +'/profile.do?ref=peoplebar&id='+ list[0].id +'" title="查看'+ list[0].name +'的个人主页" target="_blank">',
									'<img src="'+ list[0].head +'" onload="roundify(this)"/>',
								'</a>',
							'</span>',
							'<span>',
								'<a href="http://www.'+ XN.env.domain +'/profile.do?ref=peoplebar&id='+ list[0].id +'" class="name" target="_blank">'+ list[0].name +'</a>',
								'<p><a href="#nogo" onclick="showRequestFriendDialog(\''+ list[0].id +'\',\''+ list[0].name +'\',\''+ list[0].head +'\',\'\',\'sg_peoplebar\');return false;" class="addfriend_action"> 加为好友</a></p>',
							'</span>'].join('');
		friend.firstChild.onclick = this.replaceFriend;
		
		list.splice(0, 1);	
		return friend;
	},
	replaceFriend:function(e){
		e = e || window.event;
		var obj = e.target || e.srcElement;
		var node = obj.parentNode;
		var newNode = GuidBar.getFriend();
		if(newNode)
			node.parentNode.replaceChild(newNode, node);
		else
			$(node).remove();
		return false;
	}
};

(function( ns ){
 
    /*
    * 检查图片是否符合特定规则 
    * filter:{ 
    *    minHeight : 80,
    *    minWidth : 80,
    *    limitImgs : 12,
    *    maxRatioWH : 2, 
    *    maxRatioHW : 2
    *  } 
    */

    ns.imgsChecker = function( imgArry , filter){
        
        this.imgArry = imgArry;
        this.filter = filter;

        if( isUndefined( this.filter.logoWidth ) ){
            this.filter.logoWidth = 88; 
        } 

        if( isUndefined( this.filter.logoHeight ) ){
            this.filter.logoHeight = 31; 
        } 

        if( !this.filter.abortSec ) {
            this.filter.abortSec = 3; 
        }

        if( !this.filter.maxCheckCount ) {
            this.filter.maxCheckCount = 30; 
        }

        this.init();

    };

    ns.imgsChecker.prototype = {
        init : function(){
            var This = this;
            this.result = [];
            this.count = 0;
            this.stopFlag = false;
            var checkLength = Math.min(This.filter.maxCheckCount, This.imgArry.length); 
               
            for( var i = 0, j = checkLength; i < j; i++) {
               (function(index){
                    //this为图片，This为imgChecker实例

                        var img  = new Image();    
                        img.src = This.imgArry[ index ] + '?t=' + Math.random(); 
                        img.loadedTag = false;

                        var timer = setTimeout(function(){

                            if( This.count == This.filter.limitImgs || index == checkLength -1 ) {
                                if( !This.stopFlag ) This.fireEvent('checkOver');
                                This.stopFlag = true;
                                return This.result;
                            }

                        },This.filter.abortSec * 1000)

                        img.onload = function(){
                            
                            img.loadedTag = true;

                            clearTimeout( timer );

                            if( This.stopFlag ) return;

                            if( This.doFilter( this ) ) {
                                This.fireEvent('checkOne', this);
                                This.result.push( this ); 
                            }  
                            
                            if( This.count == This.filter.limitImgs || index == checkLength - 1 ) {
                                This.fireEvent('checkOver');
                                This.stopFlag = true;
                                return This.result;
                            }

                        };

                        img.onerror = function(){

                            This.imgArry.splice( index,1 );

                            if( This.count == This.filter.limitImgs || index == This.imgArry.length ) {
                                if( !This.stopFlag ) This.fireEvent('checkOver');
                                This.stopFlag = true;
                                return This.result;
                            }
                        };


               })(i)      
            } 
        },

        doFilter : function( img ){

            //特定logo 88*31
            if( img.width == this.logoWidth 
                    || img.height == this.logoHeight) {
                this.count++;
                return true; 
            }

            //非logo
            if( img.width < this.filter.minWidth 
                    || img.height < this.filter.minHeight ) {
                return false;
            }

            //长高比
            var ratioWH = img.width / img.height;
            var ratioHW = img.height / img.width;
           
            if( ratioWH > this.filter.maxRatioWH 
                    || ratioHW > this.filter.maxRatioHW) {
                return false;
            }

            this.count++;

            return true;
        }
    } 

    XN.event.enableCustomEvent( ns.imgsChecker.prototype );
 
})( XN.widgets)

XN.Bubble = function(conf){
    $extend(this,conf);
    this.init();
}
XN.Bubble.prototype = {
    bs : [],
    // ------------------------- 基本方法 ------------------------//
    init : function(){
        this.getUIRef();
        this.bindEvent();
    },
    getUIRef : function(){
        this.timer = null;
        this.elem = $(this.IDContainer);
        this.nList = $(this.elem).getElementsByTagName('section')[0];
    },
    bindEvent : function(){
        var This = this;
        this.elem.addEvent('click',function(e){
            e = e || window.event;
            var obj = e.srcElement || e.target;
            if( obj.tagName.toLowerCase()=='a' && obj.className.indexOf('x-to-hide')>=0 ){
                $(obj.parentNode.parentNode).remove();
                if(  !XN.string.trim(This.nList.innerHTML) ){
                    This.hide(); 
                }
            }
        });
        this.elem.addEvent('mouseover',function(e){
            This.delTimer();
        });
        this.elem.addEvent('mouseout',function(e){
            This.startTimer();
        });
        this.addEvent( 'view_after_hide', function(){
            This.clearBs();//关闭之后清空数据
        });
        // ------------------- 模型事件 --------------------------//
        this.addEvent( 'bubble_bs_unshifted', function(){
            This.showNtfs();
            This.show();//整个bubble显示出来
            This.startTimer();
        });
    },
    //-------------------------- 数据管理 -----------------------//
    unshiftBs : function(n){
        this.bs.unshift(n);
        this.fireEvent('bubble_bs_unshifted', n );//'bs' means bubbles
    },
    clearBs : function(){
        this.bs.length = 0;
        //this.bs = [];
    },
    //-------------------------- UI方法 -------------------------//
    showNtfs : function(){//'Ntfs' means notifies
        this.nList.innerHTML = this.makeNtfs(); 
    },
    show : function(){
        this.elem.show();
    },
    hide : function(){
        this.elem.hide();       
        this.fireEvent( 'view_after_hide' ); 
    },
    makeNtfs : function(){//'Ntfs' means notifies
        var html = [];
        XN.array.each( this.bs, function(i,bubble){
            html.push( bubble.content );
        });   
        return html.join(''); 
    },
    startTimer : function( fn ){
        var This = this;
        //EXP@huihua.lin: 对同一个东西进行定时, 应该在打开它的定时器之前, 将定时器先重置
        this.delTimer(); 
        this.timer = setTimeout(function(){
            This.hide();//3秒之后就将bubble给关了
            //fn.call( This )
        },6000);             
    },
    delTimer : function(){
        if( this.timer ){
            clearTimeout(this.timer);
        } 
    },
    //-------------------------- 外部接口 -----------------------//
    setNotify : function(n){
        this.unshiftBs(n);   
    }
}
XN.event.enableCustomEvent( XN.Bubble.prototype );

XN.dom.ready(function(){
    var b = $('system-notification-box');
    if(!b)return;
    window.xn_bubble = new XN.Bubble({
        IDContainer : 'system-notification-box'
    });
});

XN.pagerChannelIsOk = function(params) {
   try{
        if( !XN.disableWebpager ){
			var vPage = XN.getFileVersionNum('http://s.xnimg.cn/jspro/xn.app.webpager.js');
			if (vPage) vPage = vPage.version;
			else vPage = 'a0';
            var vChannel = params.wpVersion;
            var _vPage = parseInt(vPage.substring(1));
            var _vChannel = parseInt( vChannel.substring(1) );
            
            if( vChannel && _vChannel > _vPage ){//如果pager-channel里面有版本号并且大于页面中的版本号就该版本号
                XN.loadFile('http://s.xnimg.cn/'+ params.wpVersion  +'/jspro/xn.app.webpager.js');
            }
			else{//没有version的时候就取页面上的版本号
                XN.loadFile('http://s.xnimg.cn/jspro/xn.app.webpager.js');
            }
        }
    }catch(e){}
};

/*
 * XN.smartyBuddy
 *
 * 2012-5-28 jicheng.li
 * 好友列表贴边页面自动靠左
 * 实现好友列表贴边效果判断逻辑
 * 用cookie记住好友列表展开状态
 * 提供方法改变页面布局
 */
(function(){
	//逻辑:
	//页面加载过程: webpager询问应该是什么状态
	//窗口尺寸改变: 询问尺寸是否可以容纳 如果可以 展开,同时通知页面保存记录

	//2012-5-28 jicheng.li:
	//这次更改需要所有工程更新inc文件,过程比较长
	//过度期间webpager会保留原有贴边的策略,检测页面上是否有XN.smartyBuddy,如果没有继续使用原有贴边策略
	//这个过度期持续一个月,之后将删除老策略的代码
	//过度期后如果页面上没有XN.webpager,任何情况都不显示贴边效果
	
	var _layout = 0;  //布局状态
	var _close = false;  //关闭贴边效果
	var _expand = 0;  //好友列表展开状态

	var storage_key = 'l4pager';  //layout for webpager
	var loading = null;
	
	if(XN.browser.IE6 || window.location.host == 'apps.renren.com'){  //IE6不贴边 开放平台游戏页面不贴边
		_close = true;
	}

	//检查是否可以容纳贴边
	//返回屏幕尺寸相关数据,以及相关状态标志位
	this.checkExpand = function(){
		var cw, ch;
		if(document.documentElement){
			ch = document.documentElement.clientHeight;
			cw = document.documentElement.clientWidth;
		}

		return {
			width: cw,
			height: ch,
			full: (cw >= 1240) && !_close,  //是否可以容纳
			layout: _layout,   //当前布局
			loading: loading
		};
	};
	//以下逻辑确保取得正确的html标签
	var htag, i=0;
	while(htag = document.childNodes[i]){
		if(htag.tagName && htag.tagName.toLowerCase() == 'html'){
			break;
		}
		i++;
	}
	//设置页面布局 1 - 靠左居中 0 - 完整居中
	//不传参数调用,直接返回当前布局状态
	this.frameLayout = function(i){
		if(i == 1){
			htag.className = (htag.className || '') + ' marginRightForPager';
		}else if(i == 0){
			htag.className = htag.className.replace('marginRightForPager', '');
		}else{
			return _layout;
		}
		_layout = i;
		window.fireEvent('changeLayout', {layout: i});
	};

	//保存展开状态
	this.saveStat = function(s){
		var v = s ? 1 : 0;
		XN.cookie.set(storage_key, v, 365, '/', 'renren.com');
	};
	//读取cookie保存的状态
	this.readStat = function(){
		return _expand;
	};
	//取消loading效果
	this.noLoading = function(){
		if(loading && loading.parentNode){
			document.body.removeChild(loading);
		}
		loading = null;
	};

	//需要window的fireEvent功能
	object.use('dom', function(dom){
		dom.wrap(window);
	});

	//如果cookie中保存的列表是展开状态,并且屏幕尺寸够大
	_expand = XN.cookie.get(storage_key) == '1'  ?  1  : 0 ;
	if( _expand && this.checkExpand().full ){
		this.frameLayout(1);
		XN.dom.ready(function(){
			loading = document.createElement('div');
			loading.id = 'wp-buddylist-placeholder';
			document.body.appendChild( loading );
		});
	}
	XN.smartyBuddy = this;

	//一段特别2的思维历程
	//状态代码对应表:
	// expand	layout	状态
	//   1  	  0  	普通展开	2
	//   1  	  1  	贴边展开	3
	//   0  	  0  	收起  		0
})();



if(/\((iPhone|iPad|iPod)/i.test(navigator.userAgent)){
	XN.disableWebpager = true;
};

//固定定位
XN.ui.positionFixedElement = function(params){
	this.config = {
		ele: null,
		holder: 'dropmenuHolder',
		alignWith: null,
		alignType: '4-1',
		x: 0,
		y: 0
	};
	XN.$extend(this.config, params);
	this.init();
	return this;
};
XN.ui.positionFixedElement.prototype = {
	ele: null,
	holder: null,
	alignWith: null,
	alignType: null,
	x: 0,
	y: 0,
	init: function(){
		this.ele = $(this.config.ele);
		this.holder = $(this.config.holder);
		this.alignWith = $(this.config.alignWith);
		this.alignType = this.config.alignType;
		this.x = this.config.x;
		this.y = this.config.y;
		
		this.ele.style.position = XN.browser.IE6?'absolute':'fixed';
		this.ele.style.left = '-9999px';
		this.ele.style.top = '-9999px';
		
		this.holder.appendChild(this.ele);
		
		var This = this;
		XN.event.addEvent(window, 'resize', function(){
			This.refresh();
		});
		if(XN.browser.IE6){
			XN.event.addEvent(window, 'scroll', function(){
				This.refresh();
			});
		}
	},
	methods: {
		'1-1':function(f,el,x,y,p) {
			f.style.left = x + el['realLeft']() - (XN.browser.IE6?p['realLeft']():0) + 'px';
			f.style.top = y + el['realTop']() - (XN.browser.IE6?p['realTop']():0) + 'px';
		},
		'1-2':function(f,el,x,y,p) {
			f.style.left = x + el['realLeft']() - (XN.browser.IE6?p['realLeft']():0) - f['offsetWidth'] + 'px';
			f.style.top = y + el['realTop']() - (XN.browser.IE6?p['realTop']():0)  + 'px';
		},
		'1-3':function(f,el,x,y,p) {
			f.style.left = x + el['realLeft']() - (XN.browser.IE6?p['realLeft']():0) - f['offsetWidth'] + 'px';
			f.style.top = y + el['realTop']() - (XN.browser.IE6?p['realTop']():0) - f['offsetHeight'] + 'px';
		},
		'1-4':function(f,el,x,y,p) {
			f.style.left = x + el['realLeft']() - (XN.browser.IE6?p['realLeft']():0) + 'px';
			f.style.top = y + el['realTop']() - (XN.browser.IE6?p['realTop']():0)  - f['offsetHeight'] + 'px';
		},
		'2-1':function(f,el,x,y,p) {
			f.style.left = x + el['realLeft']() - (XN.browser.IE6?p['realLeft']():0) + el['offsetWidth'] + 'px';
			f.style.top = y + el['realTop']() - (XN.browser.IE6?p['realTop']():0)  + 'px';
		},
		'2-2':function(f,el,x,y,p) {
			f.style.left = x + el['realLeft']() - (XN.browser.IE6?p['realLeft']():0) + el['offsetWidth'] - f['offsetWidth'] + 'px';
			f.style.top = y + el['realTop']() - (XN.browser.IE6?p['realTop']():0) + 'px';
		},
		'2-3':function(f,el,x,y,p) {
			f.style.left = x + el['realLeft']() - (XN.browser.IE6?p['realLeft']():0) + el['offsetWidth'] - f['offsetWidth'] + 'px';
			f.style.top = y + el['realTop']() - (XN.browser.IE6?p['realTop']():0)  - f['offsetHeight'] + 'px';
		},
		'2-4':function(f,el,x,y,p) {
			f.style.left = x + el['realLeft']() - (XN.browser.IE6?p['realLeft']():0) + el['offsetWidth'] + 'px';
			f.style.top = y + el['realTop']() - (XN.browser.IE6?p['realTop']():0)  - f['offsetHeight'] + 'px';
		},
		'3-1':function(f,el,x,y,p) {
			f.style.left = x + el['realLeft']() - (XN.browser.IE6?p['realLeft']():0) + el['offsetWidth'] + 'px';
			f.style.top = y + el['realTop']() - (XN.browser.IE6?p['realTop']():0) + el['offsetHeight'] + 'px';
		},
		'3-2':function(f,el,x,y,p) {
			f.style.left = x + el['realLeft']() - (XN.browser.IE6?p['realLeft']():0) + el['offsetWidth'] - f['offsetWidth'] + 'px';
			f.style.top = y + el['realTop']() + el['offsetHeight'] + 'px';
		},
		'3-3':function(f,el,x,y,p) {
			f.style.left = x + el['realLeft']() - (XN.browser.IE6?p['realLeft']():0) + el['offsetWidth'] - f['offsetWidth'] + 'px';
			f.style.top = y + el['realTop']() - (XN.browser.IE6?p['realTop']():0) + el['offsetHeight'] - f['offsetHeight'] + 'px';
		},
		'3-4':function(f,el,x,y,p) {
			f.style.left = x + el['realLeft']() - (XN.browser.IE6?p['realLeft']():0) + el['offsetWidth'] + 'px';
			f.style.top = y + el['realTop']() - (XN.browser.IE6?p['realTop']():0) + el['offsetHeight'] - f['offsetHeight'] + 'px';
		},
		'4-1':function(f,el,x,y,p) {
			f.style.left = x + el['realLeft']() - (XN.browser.IE6?p['realLeft']():0) + 'px';
			f.style.top = y + el['realTop']() - (XN.browser.IE6?p['realTop']():0) + el['offsetHeight'] + 'px';
		},
		'4-2':function(f,el,x,y,p) {
			f.style.left = x + el['realLeft']() - (XN.browser.IE6?p['realLeft']():0) - f['offsetWidth'] + 'px';
			f.style.top = y + el['realTop']() - (XN.browser.IE6?p['realTop']():0) + el['offsetHeight'] + 'px';
		},
		'4-3':function(f,el,x,y,p) {
			f.style.left = x + el['realLeft']() - (XN.browser.IE6?p['realLeft']():0) - f['offsetWidth'] + 'px';
			f.style.top = y + el['realTop']() - (XN.browser.IE6?p['realTop']():0) + el['offsetHeight'] - f['offsetHeight'] + 'px';
		},
		'4-4':function(f,el,x,y,p) {
			f.style.left = x + el['realLeft']() - (XN.browser.IE6?p['realLeft']():0) + 'px';
			f.style.top = y + el['realTop']() - (XN.browser.IE6?p['realTop']():0) + el['offsetHeight'] - f['offsetHeight'] + 'px';
		}
	},
	show: function(){
		if(this._isShow){
			return;
		}
		this._isShow = true;
		this.methods[this.alignType](this.ele, this.alignWith, this.x, this.y, this.holder);
	},
	hide: function(){
		if(!this._isShow){
			return;
		}
		this._isShow = false;
		this.ele.style.top = '-9999px';
		this.ele.style.left = '-9999px';
	},
	refresh: function(){
		if(this._isShow){
			this._isShow = false;
			this.show();
		}
	}
};

// IE6导航固定定位 
XN.dom.ready(function(){
	if( XN.browser.IE6 ){
		var ele = $('navBar'), d = document.documentElement;
		ele.style.top = d.scrollTop + 'px';
		XN.event.addEvent(window, 'scroll', function(){
			ele.style.top = d.scrollTop + 'px';
		});
		if (document.getElementById('fixHeader')) {
			var header = document.getElementById('header'),
				toFixed = Sizzle('.header-wrapper', header)[0];
			if (!toFixed) return;
			toFixed.style.top = d.scrollTop + 'px';
			XN.event.addEvent(window, 'scroll', function(){
				toFixed.style.top = d.scrollTop + 'px';
			});
		}
	}
});
// 未登录导航更多
XN.dom.ready(function()
{
    if (!$('moreWeb'))return;
    new XN.UI.menu({
        bar: 'moreWeb',
        menu: 'moredownWeb',
        fireOn: 'click',
        alignType: '3-2',
        offsetX: 1
    });
});

/* 个人主页下拉菜单 */
object.use('dom, events, ua', function(dom, events, ua) {
    dom.ready(function() {
        var _loaded = false,
            btn = $('profileMenuActive'),
            menu = $('navProfileDropMenu'),
            appBtn = $('showAppMenu'),
            appWrap = dom.wrap(Sizzle('#appsMenuWrap')[0]);
            //alert(appWrap.innerHTML.length)
        if (!btn || !menu) return;
        var timer = null,
            timer2 = null;
        btn.addEvent('mouseover', function() {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            btn.addClass('menu-title-active');
            menu.addClass('nav-drop-menu-active');
        });
        btn.addEvent('mouseout', function() {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            timer = setTimeout(function() {
                if (window.preventHideProfileDropMenu) {
                    clearTimeout(timer);
                    timer = null;
                    return;
                }
                btn.delClass('menu-title-active');
                menu.delClass('nav-drop-menu-active');
            }, 200);
        });
        menu.addEvent('mouseover', function() {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            window.preventHideProfileDropMenu = true;
            btn.addClass('menu-title-active');
            menu.addClass('nav-drop-menu-active');
        });
        menu.addEvent('mouseout', function() {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            timer = setTimeout(function() {
                if (window.preventHideProfileDropMenu) {
                    clearTimeout(timer);
                    timer = null;
                    return;
                }
                btn.delClass('menu-title-active');
                menu.delClass('nav-drop-menu-active');
            }, 200);
            window.preventHideProfileDropMenu = false;
        });

        if (appBtn && appWrap) {

            function cutShort(name, len) {
                return name.length > len ? name.substring(0, len) : name;
            }

            function showAppsMenu() {
                if (appWrap.innerHTML.length == 0 && !_loaded) {
                    _loaded = true;
                    new XN.net.xmlhttp({
                        url: 'http://apps.renren.com/navbar/getNavHtml',
                        data: "type=new",
                        method: 'get',
                        onSuccess: function(r) {
                            appWrap.innerHTML = r.responseText;

                            var name = Sizzle('#appsMenuWrap .recentUse .appname'),
                                recname = Sizzle('#appsMenuWrap .recentUse .recIcon .appname');

                            for (var i = 0; i < name.length; i++) {
                                name[i].innerHTML = cutShort(name[i].innerHTML, 6);
                            }
                            for (var i = 0; i < recname.length; i++) {
                                recname[i].innerHTML = cutShort(recname[i].innerHTML, 5);
                            }

                            function showDrop() {
                                appWrap.setStyle('display', 'block');
                            }

                            if (ua.ua.ie6) {
                                var timerIE6 = 500;
                            } else {
                                var timerIE6 = 0;
                            }
                            setTimeout(showDrop, timerIE6);

                        },
                        onError: function(r) {
                            //XN.DO.showError('请求应用列表失败，请稍后重试...');
                            _loaded = false;
                        }
                    });
                } else {
                    appWrap.setStyle('display', 'block');
                }
            }

            appBtn.addEvent('mouseover', function() {
                if (timer2) {
                    clearTimeout(timer2);
                    timer2 = null;
                }
                appBtn.addClass('menu-title-active');
                showAppsMenu();
            });
            appBtn.addEvent('mouseout', function() {
                if (timer2) {
                    clearTimeout(timer2);
                    timer2 = null;
                }
                timer2 = setTimeout(function() {
                    if (window.preventHideProfileDropMenu) {
                        clearTimeout(timer2);
                        timer2 = null;
                        return;
                    }
                    appBtn.delClass('menu-title-active');
                    appWrap.hide();
                }, 200);
            });
            appWrap.addEvent('mouseover', function() {
                if (timer2) {
                    clearTimeout(timer2);
                    timer2 = null;
                }
                window.preventHideProfileDropMenu = true;
                appBtn.addClass('menu-title-active');
                showAppsMenu();
            });
            appWrap.addEvent('mouseout', function() {
                if (timer2) {
                    clearTimeout(timer2);
                    timer2 = null;
                }
                timer2 = setTimeout(function() {
                    if (window.preventHideProfileDropMenu) {
                        clearTimeout(timer2);
                        timer2 = null;
                        return;
                    }
                    appBtn.delClass('menu-title-active');
                    appWrap.hide();
                }, 200);
                window.preventHideProfileDropMenu = false;
            });
        }
    });
});/** 
	消息中心
**/

object.use('dom, events', function(dom, events) {
	var configuration = {
		"messageCenterDomain": "http://req.renren.com/notify/nt",
		// msgbox向下偏移高度
		"navHeight": 31,
		"storageKey": "v6_header_notify",
		// 从服务器获取红泡url
		"getBubbleUrl": "http://notify.renren.com/rmessage/getunreadcount"
	}

	var action = {
		mouseover: function(item, i) {
			var flag = dom.getElement('i', item);
			// 如果红泡是打开的，底色不高亮
			if (!XN.element.visible(flag)) {
				XN.element.addClass(item, "on");
			} else {
				XN.element.addClass(item, "hover");
			}
			switch (i) {
			case 0:
				XN.element.addClass(item, "remind-hover");
				break;
			case 1:
				XN.element.addClass(item, "apply-hover");
				break;
			case 2:
				XN.element.addClass(item, "notice-hover");
				break;
			}
		},
		mouseout: function(item, i) {
			XN.element.delClass(item, "on");
			XN.element.delClass(item, "hover");
			switch (i) {
			case 0:
				XN.element.delClass(item, "remind-hover");
				break;
			case 1:
				XN.element.delClass(item, "apply-hover");
				break;
			case 2:
				XN.element.delClass(item, "notice-hover");
				break;
			}
		},
		click: function(item, i) {
			if (XN.element.hasClassName(item, "click")) {
				XN.element.delClass(item, "click");
				$("showMessage").style.display = "none";
				setDefault();
				return false;
			}
			setDefault();
			XN.element.addClass(item, "click");
			setPosition(getOffset(item));
			switch (i) {
			case 0:
				iframe.getCon("remind");
				XN.element.addClass(item, "remind-click");
				bubble.reset("remind");
				break;
			case 1:
				iframe.getCon("apply");
				XN.element.addClass(item, "apply-click");
				bubble.reset("apply");
				break;
			case 2:
				iframe.getCon("notice");
				XN.element.addClass(item, "notice-click");
				bubble.reset("notice");
				break;
			}
		}
	}

	var bubble = {
		// 设置红泡数字
		setNum: function(i, num) {
			var _this = this,
			nun, icons = $('navMessage').getElementsByTagName('span');
			if (num >= 100) {
				num = '99';
			} else {
				num = num;
			}
			icons[i].getElementsByTagName('var')[0].innerHTML = num;
			// 当前窗口不为查看状态且红泡数大于0
			if (parseInt(num, 10) > 0 && ! XN.element.hasClassName(icons[i], "click")) {
				var cur = icons[i].getElementsByTagName('i')[0];
				// 如果当前红泡没有显示
				if (!XN.element.visible(cur)) {
					cur.style.display = "block";
					cur.style.top = '-48px';
					_this.show(i);
				}
			} else {
				icons[i].getElementsByTagName('i')[0].style.display = "none";
			}
		},
		// 设置红泡
		set: function(type, num) {
			switch (type) {
			case 'remind':
				this.setNum(0, num);
				break;
			case 'apply':
				this.setNum(1, num);
				break;
			case 'notice':
				this.setNum(2, num);
				break;
			}
		},
		// 显示红泡动画
		show: function(i) {
			var time, _this = this,
			tab = $('navMessage').getElementsByTagName('span')[i],
			obj = dom.getElement('i', tab),
			h = parseInt(obj.style.top, 10) + 1;
			time = setTimeout(function() {
				_this.show(i);
			},
			5);
			if (parseInt(obj.style.top, 10) < 0) {
				obj.style.top = h + 'px';
			} else {
				clearTimeout(time);
			}

		},
		// 设置气泡提醒展示ui
		setUI: function(data) {
			this.set("remind", parseInt(data.remind, 10));
			this.set("apply", parseInt(data.apply, 10));
			this.set("notice", parseInt(data.notice, 10));
		},
		// 重置红泡
		reset: function(type) {
			var s = XN.json.parse(webpager.getItem(configuration.storageKey));
			if (s) {
				s[type] = 0;
			}
			switch (type) {
			case "remind":
				this.setNum(0, 0);
				break;
			case "apply":
				this.setNum(1, 0);
				break;
			case "notice":
				this.setNum(2, 0);
				break;
			}
			webpager.setItem(configuration.storageKey, JSON.stringify(s));
		},
		// 从服务器端获取红包信息
		get: function() {
			new XN.net.xmlhttp({
				url: configuration.getBubbleUrl,
				data: "",
				method: "post",
				onSuccess: function(r) {
					var res = XN.json.parse(r.responseText);
					res.t = XN.cookie.get('t');
					//清除cookie中登录flag
					XN.cookie.del("first_login_flag", "/", "renren.com", "false");
					webpager.setItem(configuration.storageKey, JSON.stringify(res));
					// 清掉主页标记
					if (typeof(isHome) == 'boolean') {
						isHome = null;
					}
				},
				onError: function() {
					XN.DO.showError('网络通信失败,请重试');
				}
			});
		}
	}

	// 获取元素的绝对定位
	function getOffset(e) {
		var offste = {},
		offsetX = e.offsetLeft,
		offsetY = e.offsetTop;
		if (e.offsetParent != null) {
			offsetX += getOffset(e.offsetParent).x;
		}
		offste.x = offsetX;
		if (e.offsetParent != null) {
			offsetY += getOffset(e.offsetParent).y;
		}
		offste.y = offsetY;
		return offste;
	}

	var iframe = {
		// 绑定iframe onload事件
		onLoad: function(iframeElement, loadElement) {
			var _this = this;
			// 如果是IE类浏览器
			if (iframeElement.attachEvent) {
				iframeElement.onreadystatechange = function() {
					if (iframeElement.readyState == "complete") {
						_this.setCon(iframeElement, loadElement);
					}
				}
			} else {
				iframeElement.onload = function() {
					_this.setCon(iframeElement, loadElement);
				}
			}
		},
		// 添充iframe内容
		setCon: function(iframeElement, loadElement) {
			if (typeof(iframeElement.contentWindow.getMsgContent) == 'function') {
				loadElement.style.display = "none";
				iframeElement.contentWindow.getMsgContent();
			}
		},
		// 获取iframe内容
		getCon: function(type) {
			var text = "",
			iframeElement = $("showMessageIframe"),
			loadElement = $("loadTip");
			if (type == "remind") {
				// 取样测速
				if (window.UGC) {
					UGC.Network.ping.normal.start('800001', 'remind');
				}
				text = ['<a href="', configuration.messageCenterDomain + "#remind", '" target="_blank">全部提醒</a>'].join('');
				iframeElement.src = "http://notify.renren.com/rmessage/rmessage-apply.html?view=16&page=1&bigtype=1&v=" + new Date().getTime();
			} else if (type == "apply") {
				if (window.UGC) {
					UGC.Network.ping.normal.start('800002', 'apply');
				}
				text = ['<a href="', configuration.messageCenterDomain + "#friend", '" target="_blank">全部请求</a>'].join('');
				iframeElement.src = "http://notify.renren.com/rmessage/rmessage-apply.html?view=16&page=1&bigtype=2&v=" + new Date().getTime();
			} else if (type == "notice") {
				if (window.UGC) {
					UGC.Network.ping.normal.start('800003', 'notice');
				}
				text = ['<a href="', configuration.messageCenterDomain + "#notice", '" target="_blank">全部通知</a>'].join('');
				iframeElement.src = "http://notify.renren.com/rmessage/rmessage-apply.html?view=16&page=1&bigtype=3&v=" + new Date().getTime();
			}
			loadElement.style.display = "block";
			loadElement.innerHTML = ['<p>正在加载…</p><div>', text, '</div>'].join('');
			this.onLoad(iframeElement, loadElement);
		}
	}

	// 定位消息中心窗口
	function setPosition(offset) {
		var navm = getOffset($("navMessage")),
		showMessage = $("showMessage");
		showMessage.style.display = "block";
		showMessage.style.left = offset.x - navm.x + "px";
		showMessage.style.top = configuration.navHeight + "px";
	}

	

	// 设置当前样式
	function setDefault() {
		if ($("showMessageIframe")) {
			$("showMessageIframe").style.height = "0";
		}
		Sizzle("#navMessage span").forEach(function(item, i) {
			XN.element.delClass(item, "click");
			switch (i) {
			case 0:
				item.className = 'remind';
				break;
			case 1:
				item.className = 'apply';
				break;
			case 2:
				item.className = 'notice';
				break;
			}
			// 当前出去窗口时不显示红泡，如果在当前窗口回到默认此时来了红泡应当显示出来
			var num = parseInt(item.getElementsByTagName("var")[0].innerHTML, 10);
			if (num > 0) {
				bubble.setNum(i, num);
			}
		});
	}

	// 绑定事件
	function bindEvent() {
		Sizzle("#navMessage span").forEach(function(item, i) {
			XN.event.addEvent(item, "click", function(e) {
				action.click(item, i);
				e.stopPropagation();
			});

			XN.event.addEvent(item, "mouseover", function() {
				action.mouseover(item, i);
			});

			XN.event.addEvent(item, "mouseout", function() {
				action.mouseout(item, i);
			});
		});

		XN.event.addEvent(document, "click", function(e) {
			var e = XN.event.element(e);
			if (!e) {
				return;
			}
			if ($("showMessage") && XN.element.visible($("showMessage"))) {
				$("showMessage").style.display = "none";
				setDefault();
			}
		});
	}

	dom.ready(function() {
		dom.wrap(window);
		dom.wrap(document);
		window.addEvent('webpagerReady', function(e) {
			//初始化数据
			var persist, s = webpager.getItem(configuration.storageKey),
			isLogin = XN.cookie.get("first_login_flag");
			var ts = ['', 'remind', 'apply', 'notice'];
			if (window.asyncHTMLManager) {
				// 如果在框架里面刷新新鲜事，这个时候也去服务端取消息中心红泡信息
				window.asyncHTMLManager.addEvent('load', function() {
					if (typeof(isHome) == 'boolean') {
						bubble.get();
					}
				});
			}

			if (s) {
				s = JSON.parse(s);
				// 不是登录
				if (!isLogin) {
					persist = s;
				}
			}
			// 如果是登录或者刷新首页
			if (!persist || typeof(isHome) == 'boolean') {
				// 去服务器取数据
				bubble.get();
			} else {
				bubble.setUI(s);
			}
			// storage收到改变就发布事件通知header
			webpager.addEvent('storage', function(e) {
				if (/v6_header_notify/.test(e.keys)) {
					var s = webpager.getItem(configuration.storageKey);
					s = JSON.parse(s);
					//更新界面上的数字
					bubble.setUI(s);
				}
			});

			// 收到服务器推送
			window.webpager.messager.addEvent('message', function(e) {
				if (e.service == 'notify' && e.source == 'webpager') {
					var msg = e.data;
					setTimeout(function() {
						// 有消息来了(非通知)，播放消息声音
						//if (msg.bigtype && msg.bigtype <=2){
							if (webpager.isLocalConnect()) {
								window.imengine.imHelper.playSound();
							}
						//}	
						var s = JSON.parse(webpager.getItem(configuration.storageKey));
						s[ts[msg.bigtype]]++;
						webpager.setItem(configuration.storageKey, JSON.stringify(s));
					},
					1000 * Math.random());
				}
			});
		});
		bindEvent();
	});
});

// 账号切换
object.define('xn/site-nav/switch-account-seed', function(require, exports, module){
	window.__logEvents = false;
	require.async('xn/site-nav/switch-account', function(sa){
		sa.accMenu.show();
		sa.fetch();
		window.__logEvents = true;
	});
});
XN.dom.ready(function(){
	var m = $('accountMenu');
	if (!m) return;
	m.addEvent('mouseover', function(){
		m.delEvent('mouseover', arguments.callee);
		object.execute('xn/site-nav/switch-account-seed');
	});
});
// 帐号切换引导提示
XN.dom.ready(function(){
	if (!$('accountMenu') || !$('isShowNewHeaderTip')) return;
	var tip = $element('div');
	tip.id = 'accountMenuTip';
	tip.innerHTML = [
		'<div class="clearfix" style="border:1px solid #FF9900;background:#FFFCC3;color:#5B5B5B;width:170px;height:30px;padding:8px 3px 8px 8px;overflow:hidden;">',
			'<a href="javascript:;" class="x-to-hide" style="float:right;"></a>',
			'<div style="_line-height:normal!important;"><span style="color:#f00;">新功能：</span>点击“切换帐号”，在人人与开心帐号间切换</div>',
		'</div>',
		'<div style="background:url(http://a.xnimg.cn/imgpro/arrow/tip-arrow-up.png) 0 0 no-repeat;width:11px;height:6px;margin-top:-53px;margin-left:155px;_position:relative;"></div>'
	].join('');
	$(Sizzle('a.x-to-hide',tip)[0]).addEvent('click',function(){
		tip.hide();
		new XN.NET.xmlhttp({
			url: 'http://www.'+XN.env.domain+'/closeShowNewHeaderTip'
		});
	});
	new XN.ui.fixPositionElement({
		id: tip,
		alignWith: 'accountMenu',
		alignType: '3-2',
		offsetY: 3
	});
});

// 搜索
object.define('xn/site-nav/search-seed', function(require, exports, module){
	window.__logEvents = false;
	require.async('xn/site-nav/search',function(){
		var sinput = $('navSearchInput');
		sinput.blur();
		sinput.focus();
		window.__logEvents = true;
	});
});
XN.dom.ready(function(){
	var sinput = $('navSearchInput');
	var sb = $('searchBtnAC');
	var searchDoc = '搜人/视频/日志/照片';
	if (!sinput || !sb) return;
	/*if(!$('search_document_data')){
		if (XN.browser.IE) {
			(new XN.form.inputHelper(sinput)).setDefaultValue('搜人/视频/日志/照片');
		} else {
			sinput.setAttribute('placeholder', '搜人/视频/日志/照片');
		}		
	}*/	
	if($('search_document_data') && $('search_document_data').innerHTML != ''){
		searchDoc = $('search_document_data').innerHTML;
	}
	if(sinput){
		(new XN.form.inputHelper(sinput)).setDefaultValue(searchDoc);			
	}
	
	if(window.asyncHTMLManager) {
		sb.addEvent = function(type, callback, bubble){
			window.asyncHTMLManager.dom.Element.prototype.addEvent.call(sb, type, callback, bubble);
		};
	}
	sb.addEvent('mouseover', function() {
		sb.style.backgroundPosition = '-157px 0';
	});
	sb.addEvent('mouseout', function() {
		var ele = sb;
		if(ele.getAttribute('data-status')) ele.style.backgroundPosition = '-157px -24px';
		else ele.style.backgroundPosition = '-157px -48px';
	});
	sb.addEvent('click', function(e) {
		var val = sinput.value;		
		if(val !== '搜人/视频/日志/照片' && XN.string.trim(val) !== '' && g_searchVal2Header != val) {
			g_searchVal2Header = val;
			$('globalSearchForm').submit();
			e.preventDefault();
			return false;
		} else {
			sinput.focus();
		}
	});
	sinput.addEvent('focus', function(){
		if (sinput.hack4guide) return;
		sinput.hack4guide = true;
		sinput.delEvent('focus', arguments.callee);
		object.execute('xn/site-nav/search-seed');
		if(XN && XN.user && XN.user.id){
			var url = 'http://search.renren.com/LogSystem/cache?userid=' + XN.user.id + '&from=2'+ '&t=' + Math.random();
			new Image().src = url;
		}
	});
});
var g_searchVal2Header = null;
/**
* 动态加载photo所需的资源
* Usage:
* {
*   exec: [],
*   preLoad: [],
*   version: []
* }
* @
**/
XN.photoSeedHandler = (function() {
	function photoSeedHandler(json) {
		var list, i, len, item;

		//for (list = json.version, i = 0, len = list.length; i < len; i += 1) {
		try {
			XN.getFileVersion(json.version);
		}
		catch(e) {}
		//}
		for (list = json.preLoad, i = 0, len = list.length; i < len; i += 1) {
			item = new Image();
			item.src = list[i];
		}

		for (list = json.exec, i = 0, len = list.length; i < len; i += 1) {
			try {
				if (list[i].path()) {
					XN.loadFile(list[i].src);
				}
			}
			catch(e) {}
		}
	}

	XN.dom.ready(function() {
		var psrc = 'http://s.xnimg.cn/n/apps/photo/modules/seed/photoSeed.js?r=' + ( + new Date());

		if (window.photoSeedSrc) {
			psrc = window.photoSeedSrc;
		}

		var script = document.createElement('script');
		script.type = 'text/javascript';
		script.async = true;
		script.src = psrc;
		document.getElementsByTagName('head')[0].appendChild(script);
	});

	return photoSeedHandler;
})();

object.add('xn', './ui, ./net', function(exports) {
});
object.define('xn.net', 'sys, net', function(require, exports) {

var sys = require('sys');
var net = require('net');

/*
 * 保证ajax发送时带有token
 * 通过mixin替换net module的send方法，在send之前解析发送的数据，加入requestToken项。
 * 这样就需要每个引入了net module的module注意同时引入xn.net，或者直接使用 xn.net.Request 进行数据发送
 */

var oldSend = net.Request.prototype.send;
net.Request.set('send', function(self, data) {
	data = data || self.data || '';
	if (self.method == 'post' && XN.get_check && !/[\?|\&]requestToken=/.test(data)) {
		data += (data ? '&' : '') + 'requestToken=' + XN.get_check;
	}
	if (self.method == 'post' && XN.get_check_x && !/[\?|\&]_rtk=/.test(data)) {
		data += (data ? '&' : '') + '_rtk=' + XN.get_check_x;
	}
	oldSend.call(self, data);
});

this.Request = net.Request;

});
object.add('xn.ui', 'sys', function(exports, sys) {

var ui = sys.modules['ui'];

if (ui) {

	ui.Component.__mixin__({
		error: function(self, msg) {
			XN.DO.showError(msg);
		},
		invalid: function(self, msg) {
			XN.DO.showError(msg);
		}
	});

}

ui = sys.modules['ui2'];

if (ui) {

	ui.Component.__mixin__({
		error: function(self, msg) {
			XN.DO.showError(msg);
		},
		invalid: function(self, msg) {
			XN.DO.showError(msg);
		}
	});

}

});
/*
 * 统一吸顶事件
 */
;object.define('xn/attachceil', 'dom, ua', function(require, exports) {

    var dom = require('dom'),
        ua = require('ua'),
        DELTA = 1,
        DEFAULT_FIX = 40,
        ATTR = 'scrollTop',
        body = document[ua.ua.webkit ? 'body' : 'documentElement'],
        MARK_NAME = 'already-fixed';

    exports.AttachCeilWrapper = new Class(function() {

        this.listen = staticmethod(function(className) {
            var ele = dom.getElement(className);
            if (ele) {
                new exports.AttachCeilWrapper(ele);
            }            
        });

        this.initialize = function(self, container) {
            self.container = container; //外层容器节点

            self.__backupPosition = XN.element.getStyle(self.container, 'position');
            self.__backupTop = XN.element.getStyle(self.container, 'top');

            self.finalTop = null;
            DEFAULT_FIX = !! document.getElementById('fixHeader') ? 100 : 40;
            // V5版本导航条未吸顶
            if (XN.fedstatsFlag_v5_home) DEFAULT_FIX = 5;
            // self.fix = DEFAULT_FIX || parseInt(self.container.getData('fix'));
            self.fix = DEFAULT_FIX;

            self.footer = dom.id('footer');

            self.refix();

            self.bindEvents();
        };

        this.refix = function(self) {
            self.container.removeClass(MARK_NAME);
            if (ua.ua.ie) {
                body[ATTR] ++;
                body[ATTR] --;
            }
        };

        this.bindEvents = function(self) {
            self.bindLayoutEvent();
            self.bindScrollEvent();
        };

        this.bindLayoutEvent = function(self) {
            dom.wrap(window).addEvent('changeLayout', function() {
                self.refix();
            });
        };

        this.bindScrollEvent = function(self) {
            dom.wrap(window).addEvent('scroll', function() {
                var ft = self.getRealTop(self.footer),
                    rTop = self.finalTop || self.getRealTop(self.container);

                if (body[ATTR] + self.fix >= rTop) {
                    self.finalTop = rTop;       
                    self.addFixedStyle();
                    if (ua.ua.ie == 6) {
                        if (body[ATTR] + 255 < ft) {
                            self.container.style.top = (body[ATTR] + self.fix) + 'px';
                        }
                    }
                } else {
                    self.finalTop = null;
                    self.removeFixedStyle();
                }
            }, true);
        };

        this.getRealTop = function(self, element) {
            return XN.element.realTop(element);
        };

        this.addFixedStyle = function(self) {
            
            self.container.addClass(MARK_NAME);
            XN.element.setStyle(self.container, 'position:fixed; _position:absolute; _zoom:1;top:' + self.fix + 'px');

            
        };

        this.removeFixedStyle = function(self) {
            self.container.removeClass(MARK_NAME);
            XN.element.setStyle(self.container, 'position:' + self.__backupPosition + ';top:' + self.__backupTop + ';');
        };
    })
});

object.use('xn/attachceil, dom', function(attachceil, dom) {
    var wrapper = attachceil.AttachCeilWrapper,
        className = '.attachceilwrap';
    dom.ready(function() {
        wrapper.listen(className);
        if(window.asyncHTMLManager) {
            window.asyncHTMLManager.addEvent('load', function() {
                wrapper.listen(className);
            });
        }
    });
});
/* 分享按钮添加事件 */
XN.event.addEvent(document, 'mouseover', function(e) {
	var target = $(XN.event.element(e || window.event));
	if (!target) return false;
	if (!target.hasClassName('share_new')) {
		return false;
	}
	if (!window.XNShareObject) {
		setTimeout(function() {
			XN.loadFile('http://s.xnimg.cn/jspro/xn.app.share.js', function() {
				XNShareObject._register({
					//不需要老接口可以写成false
					autoRegister: false,
					//浮动层模式
					floatMode: true
				});
				XNShareObject.forceShowFloat(target);
			});
		}, 0);
	}
});
;;;
/**
 * mention seed
 * @Author chuanye.wang
 */
object.define('xn.mention', 'dom', function(require, exports, module) {
	var dom = require('dom');
	var initMain = this.initMain = function(obj, item, cb){
		if (obj.mentionInited) return;
		obj.mentionInited = true;
		// 动态加载mentionMain模块
		require.async('xn/mentionMain', function(mentionMain) {
			mentionMain.Mention.init({
				obj: item.obj,
				ugcId: item.ugcId || '',
				ugcType: item.ugcType || '',
				ownerId: item.ownerId || '',
				scrollable: item.scrollable,
				popTop: item.popTop,
				whisper: (item.whisper === false ? false : true),
				button: item.button || null,
				limit: item.limit || 10,
				recentLimit: item.recentLimit || 6
			});
			if (cb) cb();
		});
	};
	
	/**
	 * @method 点击@按钮后的行为
	 * @param {HTML Element} obj
	 * @param {Event Object} e
	 */
	var buttonClick = function(obj, e){
		if (e) XN.event.stop(e);
		dom.wrap(obj);
        if (XN.browser.WebKit) {
            obj.focus();
            obj.blur();
        }
		obj.focusToPosition(obj.get('selectionStart'));
		var action = function(){
			var toInsertVal = '@',
				elVal = XN.form.help( obj ).getRealValue();
			var cpos = obj.get('selectionStart');
			if(  elVal.slice(cpos - 1, cpos) == '@' ) {
				toInsertVal = '';
			}
			obj.value = elVal.slice(0, cpos) + toInsertVal + elVal.slice( cpos );
			obj.focusToPosition( cpos + toInsertVal.length);
			obj.mention.check();
		};
		if (XN.browser.IE) {
			setTimeout(action, 0);
		} else {
			action();
		}
	};
	
	this.Mention = {
		init: function(list) {
			for (var i = 0; i < list.length; i++) {
				(function(item) {
					var obj = item.obj;
					if (obj.mention) return;
					obj = $(obj);
					obj.addEvent('focus', function() {
						initMain(obj, item);
					});
					if (item.button) {
						XN.event.addEvent(item.button, 'click', function(e){
							if (obj.mention) {
								buttonClick(obj, e);
							} else {
								initMain(obj, item, function(){
									buttonClick(obj, e);
								});
							}
						});
					}
				})(list[i]);
			}
		}
	};
});

object.use('xn.mention', function(xn) {
	window.Mention = xn.mention.Mention;
});
object.use('dom, ua, ua.extra, ua.flashdetect, ua.os', function(dom, ua) {
	var strs = [];
	var core = ua.ua.core;
	var shell = ua.ua.shell;
	var coreVersion = ua.ua[core];
	if (coreVersion) {
		strs.push(core + '=' + coreVersion);
	}
	var shellVersion = ua.ua[shell];
	if (shellVersion) {
		strs.push(shell + '=' + shellVersion);
	}
	if (shell != 'ieshell' && ua.ua.ieshell) {
		strs.push('ieshell=' + ua.ua.ieshell); // 套壳浏览器，统计系统IE版本
	}
	var flashVersion = ua.flashdetect.getFlashVersion();
	if (flashVersion) {
		strs.push('flash=' + flashVersion);
	}

	var oscore = ua.os.oscore;
	if(oscore != 'unknown') {
		strs.push('oscore=' + oscore);
		var osVersion = ua.os[oscore];
		if(osVersion != 'unknown') {
			if(typeof osVersion != 'object') {
				strs.push('os_ver=' + osVersion);
			} else {
				for(var prop in osVersion) {
					strs.push('os_dist=' + prop);
					if(osVersion[prop] != 'unknown') {
						strs.push('os_dist_ver=' + osVersion[prop]);
					}
					break;
				}
			}
		}
	}
	// 统计分辨率
	if (ua.os.resolution) {
		strs.push('res_width=' + ua.os.resolution.width);
		strs.push('res_height=' + ua.os.resolution.height);
	}

	// 统计移动设备方向
	if (ua.os.orientation != 'unknown') {
		strs.push('orientation=' + ua.os.orientation);
	}
	
	XN.net.sendStats('http:\/\/s.renren.com\/speedstats\/browser\/stats.php?' + strs.join('&'));

	var desc, url, key = 1;

	var shellMap = {
		'se360': '360安全浏览器',
		'sogou': '搜狗浏览器',
		'maxthon': '傲游浏览器',
		'theworld': '世界之窗浏览器',
		'qqbrowser': 'QQ浏览器',
		'tt': '腾讯TT浏览器'
	};
	var shell = shellMap[ua.ua.shell] || '兼容浏览器';

	if (ua.ua.ie >= 6 && ua.ua.ie < 7) {
		var now = new Date().getTime();
		if (now >= 1309503600000 && now <= 1309514400000 && XN.cookie.get('fie') != 2) { // 2011/7/1 15:00 - 2011/7/1 12:00
			key = 2;
			url = 'http://noie6.renren.com/';
			desc = '人人网温馨提示：优化上网体验，体验极速之旅 <a href="http://noie6.renren.com/down/360cse-promote" style="text-decoration:none"><img src="http://a.xnimg.cn/sites/noie6/res/browsers/360cse-icon.png" style="vertical-align:text-bottom" /> 360极速浏览器</a>&nbsp;&nbsp;&nbsp;<a href="http://noie6.renren.com/down/sogou-promote" style="text-decoration:none"><img src="http://a.xnimg.cn/sites/noie6/res/browsers/sogou-icon.png" style="vertical-align:text-bottom" /> 搜狗高速浏览器</a>'
		} else if (!XN.cookie.get('fie')) {
			if (ua.ua.shell == 'ieshell') {
				url = 'http://noie6.renren.com/';
				desc = '致IE6用户的一封信';
			} else {
				url = 'http://dl.xnimg.cn/down/IE8-WindowsXP-x86-CHS.exe';
				desc = '尊敬的用户，您目前使用的是IE6内核的' + shell + '，为了给您带来更快速、更安全、更优质的体验，人人网将逐步降低IE6内核的支持，我们建议您尽快<a href="' + url + '">升级您的系统浏览器为IE8</a>，这不会对您使用' + shell + '产生任何影响，感谢您的支持。';
			}
		}

		if (url && desc) {
			dom.ready(function() {
				var div = document.getElementById('ie6notice');
				if (div) div.innerHTML = '<div style="position:relative;"><div onclick="window.open(\'' + url + '\');" style="cursor:pointer;background:#FFFBC1;border-bottom:1px solid #F9B967;padding:5px;text-align:center;font-size:14px;"><div style="width:965px;padding-right: 15px;">' + desc + '</div></div><a href="#nogo" onclick="XN.cookie.set(\'fie\',' + key + ',30,\'/\',\'renren.com\');$(\'ie6notice\').hide();return false;" class="x-to-hide" style="height:14px;width:14px;overflow:hidden;position:absolute;top:8px;right:10px;" title="关闭"></a></div>';
			});
		}
	}
});
XN.dom.ready(function() {
	if(showNamecardCondition()) {
		object.use('xn/namecard/seed', function(seed) {
			seed.loadNamecardMatrix();
		});
	}
});

function showNamecardCondition() {
	if(XN.user && XN.user.id) return true;
	else return false;
}

object.define('xn/namecard/seed', 'dom', function(require, exports) {
	exports.loadNamecardMatrix = function() {
		var dom = require('dom');
		window.globalNamecard = {'additionalY':0, 'delRcd':false};
		
		// 兼容好友推荐
		window.globalNamecard.addFriendCallback = function(notAdded) {
			if(!window.globalNamecard.delRcd) return;
			var id = window.globalNamecard.delRcd.id.substring(16),
				type = window.globalNamecard.delRcd.getAttribute('data-type');

			if(!notAdded) {
				logRcd({action:'RecFcard_addFriendEnd', guest_id:id, type:type});
				window.globalNamecard.delRcd.parentNode.removeChild(window.globalNamecard.delRcd);
			} else {
				logRcd({action:'RecFcard_addFriend', guest_id:id, type:type});
			}
		}

		dom.wrap(document.body).delegate('*[namecard]', 'mouseover', function() {
			dom.wrap(document.body).undelegate('*[namecard]', 'mouseover', arguments.callee);
			require.async('xn/namecard, xn/showShareFriend', function(namecard) {
				window.globalNamecard.namecard = new namecard.Namecard(window.globalNamecard.additionalY);
			});
		});
	}	
});
object.define("xn/wiki/log","net",function(require,exports){
	var net = require('net');
	var url = "http://wiki.renren.com/ajax/click_log"
	exports.clickLog = sendLog;
	function sendLog(tag,wikiId,ref) {
		tag = (tag)?tag:'';
		wikiId = (wikiId)?wikiId:'';
		ref = (ref)?ref:'';
		var request = new net.Request( {
					url: url,
					method: "post"
				} );
		var reqData = "tag="+tag+"&wikiId="+wikiId+"&ref="+ref;
		request.send(reqData);
	}
});object.define('xn/wiki/highlight','dom,events,string',function(require,exports){
	var dom = require("dom");
	var str = require("string");
	exports.init = function(){
		//获取全部包含wikiwords的容器
		var wikiList = dom.getElements("*[data-wiki]");
		for(var i=0;i<wikiList.length;i++){					
			var wikiDiv = wikiList[i];
			//获取wikiwords的keyvalue MAP
			var wikiAttr = wikiDiv.getAttribute("data-wiki");
			if(wikiAttr){
				if(wikiAttr!=null){
					wikiAttr = wikiAttr.replace(/'/g,"\"");
					var wikiWords;
					try{
						wikiWords =JSON.parse("{\"wikiWords\":"+wikiAttr+"}");//需要排除里边有单引号导致解析json错误的问题
					}
					catch(ex){
						continue;
					}					
					var wikiArr = new Array();			
					for(var k in wikiWords.wikiWords){
						var tmpArr = {id:k,word:wikiWords.wikiWords[k]};
						wikiArr.push(tmpArr);			
					}	
					if(wikiArr.length>0){
						wikiArr.sort(function(a,b){
							var la = (a["word"]).length;
						  	var lb = (b["word"]).length;
						  	if(la > lb)
						  		return -1;
						  	else if(la < lb)
						  		return 1;
						  	else 
						  		return 0;
						});
						var html = wikiDiv.innerHTML;
						html = "<w>"+html+"<w>";
						//console.log(html);
						/**
						step0:增加<w>然后寻找">任意字符wikiWord任意字符<"的匹配
						step1:替换每个匹配的wiki词条为{wikiid-61000005}
						step2:替换{wikiid-61000005}为wiki词条
						note:实现非HTML属性的内容替换，并实现对"仙剑奇侠传三"的优先替换以及“仙剑奇侠传”的替换
						*/
						for(var t=0;t<wikiArr.length;t++){
							var wordReal = wikiArr[t]["word"].replace("&#39;","'");
							var word = wikiArr[t]["word"].replace("&#39;","'");
							word = word.replace(" ","\\s");
							word = word.replace("(","\\(");
							word = word.replace(")","\\)");//处理单引号、括号
							var reg = new RegExp(">[^>]*("+word+")[^>]*<");
							strArr = html.match(reg);
							if(strArr!=null){
								for(var x=0;x<1;x++){//只匹配第一个strArr.length
									html = html.replace(strArr[x],strArr[x].replace(wordReal,"{wikiid-"+wikiArr[t]["id"]+"}"));
								}
							}
						}
						for(var t=0;t<wikiArr.length;t++){
							var wordReal = wikiArr[t]["word"].replace("&#39;","'");
							var reg = new RegExp("{wikiid-"+wikiArr[t]["id"]+"}");
							var regWithA = new RegExp(">[^>]*({wikiid-"+wikiArr[t]["id"]+"})[^>]*</[aA]");
							// var regWithA = new RegExp(">[^>]*({wikiid-"+wikiArr[t]["id"]+"})[^>]*</a|A");//这样会有些地方误匹配
							var strA = html.match(regWithA);
							//增加超链接，需要判断自己的父容器是不是a标签，如果是则不加超链接
							//console.log(strA);
							//console.log(strA);
							if(strA!=null&&strA.length>0){
								html = html.replace(reg,"<span class='wiki-highlight' wikicard='"+wikiArr[t]["id"]+"'>"+wordReal+"</span>");
							}								
							else{
								html = html.replace(reg,"<span class='wiki-highlight' wikicard='"+wikiArr[t]["id"]+"'><a class='wiki-highlight' href='http://wiki.renren.com/"+wikiArr[t]["id"]+"' target='_blank'>"+wordReal+"</a></span>");
							}
							//var reg2 = new RegExp("{wikiid-"+wikiArr[t]["id"]+"}","g");
							//html = html.replace(reg2,wordReal);
						}
						wikiDiv.innerHTML = html.replace(/<w>/g,"");
						wikiDiv.removeAttribute("data-wiki");
					}
	
				}
			}			
			
			
		}
		
	};

});

object.use('dom,net,events,xn/wiki/highlight,xn/wiki/log', function(dom,net,events,light,log) {
	//注册到window,静态页面需要调用
	window.wikiHighlight = function(){		
		//判断是否白名单
		if(XN.user.inWikiWhiteList=="true"){
			XN.loadFiles(["http://s.xnimg.cn/apps/wiki/css/wiki-card-all-min.css"], function(){
				light.init();
			});
		}		
	};
	dom.ready(function() {
	//判断是否白名单
	if(XN.user.inWikiWhiteList=="true"){
		if (window.asyncHTMLManager) window.asyncHTMLManager.addEvent('load', function() {window.wikiHighlight();}, events.HOLD);
		window.wikiHighlight();
		//dom.wrap(document.body).undelegate('*[wikicard]', 'mouseover',showcard);
		var wikicard = undefined;
		    // dom.wrap(document).getElements('*[wikicard]').delegate('a', 'mouseover',function(){
			dom.wrap(document.body).delegate('*[wikicard]', 'mouseover',function(){
				var This = this;
				XN.loadFiles(["http://s.xnimg.cn/apps/wiki/js/wiki_model.js","http://s.xnimg.cn/apps/wiki/js/wikicard-load.js"],function(){
						if(!wikicard){
							object.use("xn/wiki/card",function(card){
								wikicard = card;
							});	
						}
						wikicard.showCard(This);
				});
			});
			dom.wrap(document.body).delegate('*[wikicard]', 'click',function(){
				log.clickLog("hl_word");
			});
	}
	});	
});







