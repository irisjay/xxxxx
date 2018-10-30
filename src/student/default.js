var { T, $, apply, L, R, S, Z, Z_, Z$, sanc, memoize, TimelineMax,
so, by, and_by, under,
go, never, panic, panic_on,
just_now, temporal,
fiat, data, data_lens, data_iso, data_kind,
n_reducer, pair_zip_n, pair_zip, pair_projection,
map_defined_, map_defined, from_just, maybe_all,
sole, every, delay,
bool, number, timestamp, string,
list, map, maybe, nat, id, v,
shuffle, uuid, api, post,
student, question, choice, answer, latency, ping, position,
attempt, opportunity, past, board, rules, setup,
teacher_app, student_app,
board_viewer,
io, message, ensemble, 
default_questions, default_rules,
as_maybe, as_defined, as_complete, complete_,
app_as_get_ready, app_as_playing, app_as_game_over,
setup_as_room, setup_as_questions, setup_as_rules,
board_viewer_as_board, board_viewer_as_questions, board_viewer_as_past,
io_as_inert, io_as_connecting, io_as_heartbeat,
ensemble_as_questions, ensemble_as_rules,
ensemble_as_ping, ensemble_as_start, ensemble_as_abort,
ensemble_as_student_pings, ensemble_as_student_starts,
ensemble_as_student_boards, ensemble_as_student_histories,
attempt_as_position, attempt_as_latency, opportunity_as_attempts, opportunity_as_position, past_as_opportunities,
app_as_setup, app_as_student, app_as_students, app_as_room,
app_as_board, app_as_past, app_as_questions,
opportunity_as_attempts,
rules_as_size, setup_as_size,
question_as_question, question_as_answers,
cell_as_position, as_position,
cell_as_choice, student_name,
past_stepped,
message_encoding, messages_encoding,
assemble_students, schedule_start,
teacher_app_get_ready_to_playing, 
student_app_get_ready_to_playing, student_app_playing_to_next,
student_app_to_board_viewer,
current_question,
question_choice_matches, 
board_viewer_current_question,
board_viewer_answered_positions, board_viewer_bingoed_positions
} = window .stuff


var feedback = data ({
  nothing: () => feedback,
  enter_room: (room =~ room) => feedback,
  enter_name: (name =~ string) => feedback,
  attempt_question: (position =~ position) => feedback })

var lookbehind = data ({
	nothing: () => lookbehind,
	bad_room: (room =~ room) => lookbehind,
	attempting: (since =~ latency, blocked =~ bool) => lookbehind })


var feedback_nothing = data_iso (feedback .nothing)
var feedback_enter_room = data_iso (feedback .enter_room)
var feedback_enter_name = data_iso (feedback .enter_name)
var feedback_attempt_question = data_iso (feedback .attempt_question)

var lookbehind_nothing = data_iso (lookbehind .nothing)
var lookbehind_bad_room = data_iso (lookbehind .bad_room)
var lookbehind_attempting = data_iso (lookbehind .attempting)

var lookbehind_room = data_lens (lookbehind .bad_room) .room
var lookbehind_since = data_lens (lookbehind .attempting) .since
var lookbehind_blocked = data_lens (lookbehind .attempting) .blocked






var app_state = S .data (student_app .get_ready (Z .Nothing, Z .Nothing))
 
var io_state = S .data (io .inert)
var ensemble_state = S .data (undefined)

var feedback_state = temporal (feedback .nothing)
var lookbehind_state = S .data (lookbehind .nothing)








 
var clicking = ['click']


var room_entry_view = _ => so ((_=_=>
  <room-entry-etc>
    <code fn={ room_entry_feedback }>
      <input placeholder="Enter a room code" />
      <button> Go </button> </code>
      { !! (L .isDefined (lookbehind_bad_room) (lookbehind_state ()))
        ? <message>{ bad_room } is not a valid room</message>
        : [] } </room-entry-etc>,
  where
  , bad_room = T (lookbehind_state ()) (L .get (lookbehind_room))
  , room_entry_feedback = _dom => so ((_=_=>
      (_input .addEventListener ('keypress', _e => {;
        if (_e .keyCode === 13) {
          ;let_room_enter () } }),
      clicking .forEach (click => {;
        ;_button .addEventListener (click, _e => {;
          ;let_room_enter () }) })),
      where
      , _input = _dom .querySelector ('input')
      , _button = _dom .querySelector ('button')
      , let_room_enter = _ => {;
          var value = _input .value
          ;_input .value = ''
          ;feedback_state (feedback .enter_room (value)) } )=>_))=>_)

var name_entry_view = _ => so ((_=_=>
  <student-entry-etc>
    <name fn={ name_entry_feedback } >
      <input placeholder="Enter your name" />
      <button> Go </button>
    </name> </student-entry-etc>,
  where
  , name_entry_feedback = _dom => so ((_=_=>
      (_input .addEventListener ('keypress', _e => {;
        if (_e .keyCode === 13) {
          ;let_name_enter () } }),
      clicking .forEach (click => {;
        ;_button .addEventListener (click, _e => {;
          ;let_name_enter () }) })),
      where
      , _input = _dom .querySelector ('input')
      , _button = _dom .querySelector ('button')
      , let_name_enter = _ => {;
          var value = _input .value
          ;_input .value = ''
          ;feedback_state (feedback .enter_name (value)) } )=>_))=>_)


var get_ready_view = <get-ready-etc>
	{ so ((
		take
		, room = T (app_state ()) (L .get ([ app_as_room, as_maybe ]))
		, student = T (app_state ()) (L .get ([ app_as_student, as_maybe ])) ) =>
		!! Z .isNothing (room) ?
      !! (L .isDefined (io_as_inert
      ) (io_state ()))
			? room_entry_view
			: !! (L .isDefined (L .choice (io_as_connecting, io_as_heartbeat)
      ) (io_state ()))
      ? 'Finding room...'
      : panic ('invalid io at get ready view')
		:!! Z .isNothing (student) ?
      !! (L .isDefined (io_as_inert
      ) (io_state ()))
			? name_entry_view
			: !! (L .isDefined (L .choice (io_as_connecting, io_as_heartbeat)
      ) (io_state ()))
      ? 'Trying to join room...'
      : panic ('invalid io at get ready view')
		: so ((_=_=>
      [ <room> {'Connected to room ' + _room } </room>
      , 'Waiting for game to start...' ]
      .map (_x => <div>{ _x }</div>),
      where
      , { _room, _student } = { _room: from_just (room), _student: from_just (student) } )=>_))
	} </get-ready-etc>

var playing_view = _ => <playing-etc>
	{ T (student_app_to_board_viewer (app_state ())
		) (_board_viewer =>
			so ((_=_=>
			[ T (current_question
				) (Z_ .maybe ('') (_x => <question>{ L .get (question_as_question) (_x) }</question>))
			, <ticker>{ T (game_tick) (map_defined_ ([]) (t => 10 - t)) }</ticker>
			, <board> { T (_board) (Z_ .map (_row => 
					<row> { T (_row) (Z_ .map (_cell =>
						so ((_=_=>
						!! (_cell_bingo)
						? <cell>{ bold_crossed (_cell_choice) }</cell>
						:!! (_cell_crossed)
						? <cell>{ crossed (_cell_choice) }</cell>
						: <cell fn={ cell_feedback (_cell) }>{ _cell_choice }</cell>,
						where
						, _cell_position = T (_cell) (L .get (cell_as_position))
						, _cell_choice = T (_cell) (L .get (cell_as_choice))
						, _cell_crossed = Z .elem (_cell_position) (crossed_positions)
						, _cell_bingo = R .any (Z .elem (_cell_position)) (bingoed_positions)
						, crossed = _x => <s>{ _x }</s>
						, bold_crossed = _x => <s><b>{ _x }</b></s> )=>_)))
						} </row> )) } </board> ],
			where
			, _board = T (_board_viewer) (L .get (board_viewer_as_board))
			, current_question = T (_board_viewer) (board_viewer_current_question)
			, crossed_positions = T (_board_viewer) (board_viewer_answered_positions)
			, bingoed_positions = T (_board_viewer) (board_viewer_bingoed_positions)
			, game_tick = just_now (game_tick_sampler)
      , cell_feedback = cell => _dom => {;
          ;clicking .forEach (click => {;
            ;_dom .addEventListener (click, _ => {;
              ;feedback_state (feedback .attempt_question (T (cell) (L .get (cell_as_position)))) }) }) } )=>_)) } </playing-etc>

var game_over_view = _ => so ((_=_=> so ((_=_=>
	<game-over-etc>
		<result-etc>
			<tabs>
				<button> Overview </button>
				<button> Question </button>
				</tabs>
			<id><img src={ student_img } />  (name) </id>
			<div a-logo> <img src={ bingo_img } /> </div>
			<table a-result>
				<tr>
					<th>Question</th>
					<th>Attempts</th>
					<th>Avg. Time</th>
					</tr>
				<tr>
					<td></td>
					<td></td>
					<td></td>
					</tr>
					</table>
					</result-etc>
					</game-over-etc>,
	where							
	, bingo_img = 'https://cdn.glitch.com/5a2d172b-0714-405a-b94f-6c906d8839cc%2Fimage5.png?1529492559081' 
	, student_img = 'https://cdn.glitch.com/cf9cdaee-7478-4bba-afce-36fbc451e9d6%2Fimage18.png'
	, _app = app_state ()
	, _ensemble = ensemble_state ()
	, all_students = T (_ensemble) (assemble_students (_app))
	, questions = T (_app) (L .collect ([ app_as_questions, L .elems, question_as_question ]))
	, attempts = T (_app) ([ L .collect ([ app_as_past, L .elems, opportunity_as_attempts ]), Z_ .map (Z_ .size) ])
	//TODO: make readable
	, average_time = T (_ensemble) ([
			assemble_students (_app),
			Z_ .map ($ ([
				Z .snd,
				L .collect ([ [1], L .elems, opportunity_as_attempts, L .last, [1], as_maybe ]),
				Z .map (Z .of (Array)) ])),
			_x => Z .reduce (Z .zipWith (Z .concat)) (R .head (_x)) (R .tail (_x)),
			Z .map ($ ([ Z .justs, average, Z_ .fromMaybe (_ => panic ('average time fail!')) ])) ]) )=>_),
  where
	, average = by (list => $ ([
			Z .sum,
			Z .div (Z .size (list)) ])) )=>_)


window .view = <student-app>
	{ !! (L .isDefined (app_as_get_ready) (app_state ()))
		? get_ready_view
		: !! (L .isDefined (app_as_playing) (app_state ()))
		? playing_view
		: !! (L .isDefined (app_as_game_over) (app_state ()))
		? game_over_view
		: panic ('undefined app state in view') } </student-app>














/*
var lookbehind_latency = _ => {
		var now = game_clock .time ()
		var start = T (game_clock .getLabelTime ('next'))
			(_x => !! (_x === -1) ? 0 : _x)
		return now - start }
*/
			 
			 
			 
			 
			 
var record_room = _room => {;
	var _student_maybe = T (S .sample (app_state)) (L .get ([ app_as_student, as_maybe ]))
	;go 
	.then (_ =>
		io_state (io .connecting) && api (_room)
		.then (panic_on ([ [Z_ .equals ({}), 'empty room; expired code?'] ]))
		.then ($ ([
			L .get (L .inverse (data_iso (ensemble .ensemble))),
			_ensemble => {;
				var _questions = T (_ensemble) (L .get (ensemble_as_questions))
				var _rules = T (_ensemble) (L .get (ensemble_as_rules))
				var _setup = setup .setup (_room, _questions, _rules)
				;app_state (
					student_app .get_ready ( _student_maybe, Z .Just (_setup) )) } ])) )
		.catch (_e => {;
			;lookbehind_state (lookbehind .bad_room (_room))
			;console .error (_e) })
		.then (_ => {;
			;io_state (io .inert) }) }

var record_student = _name => {;
	var _setup_maybe = T (S .sample (app_state)) (L .get ([ app_as_setup, as_maybe ]))
	;app_state (
		student_app .get_ready (
			Z .Just ([ uuid (), _name ])
			, _setup_maybe )) }

var connect_room = _ => {;
	;T (S .sample (app_state)
  ) (
	under (
    complete_ ({
      _student: app_as_student,
      _room: app_as_room })
  ) (({ _student, _room }) => {;
		var _setup
		;return go 
		.then (_ =>
			io_state (io .connecting) && api (_room)
      .then (panic_on ([ [Z .equals ({}), 'empty room; expired code?'] ]))
			.then ($ ([
				 L .get (L .inverse (data_iso (ensemble .ensemble))),
				 _ensemble => {;
					 var _questions = T (_ensemble) (L .get (ensemble_as_questions))
					 var _rules = T (_ensemble) (L .get (ensemble_as_rules))
					 ;_setup = setup .setup (_room, _questions, _rules) } ])) )
		.then (_ =>
			api (_room, post (message_encoding (
				message .student_ping (_student, [0, 0, 0]) )))
			.then (panic_on ([ [_x => ! _x .ok, 'not ok'] ])) )
		.then (_ => {; 
			;app_state (
				student_app .get_ready (Z .Just (_student), Z .Just (_setup))) })
		.catch (_e => {;
			;lookbehind_state (lookbehind .bad_room (_room))
			;console .error (_e) })
		.then (_ => {;
			;io_state (io .inert) }) })) }

var attempt_question = _position => {;
	T (S .sample (app_state)) ([ student_app_to_board_viewer,
		_board_viewer => {;
		//Z_ .chain (board_viewer_current_question),
			var _question = T (_board_viewer) ([ board_viewer_current_question, from_just ])
			var _board = T (_board_viewer) (L .get (board_viewer_as_board))
			var _choice = T (_board) (L .get ([ as_position (_position), cell_as_choice ]))
			if (! L .get (lookbehind_blocked) (S .sample (lookbehind_state))) {
				var latency = game_clock .time () //lookbehind_latency ()
        if (question_choice_matches (_question) (_choice)) {
          ;T (S .sample (app_state)) ([
            L .set
              ([app_as_past, past_as_opportunities, L .last, opportunity_as_attempts, L .append])
              ([_position, latency]),
            student_app_playing_to_next,
            _x => {;app_state (_x)} ]) }
        else {
          ;T (S .sample (app_state)) ([
            L .set
              ([app_as_past, past_as_opportunities, L .last, opportunity_as_attempts, L .append])
              ([_position, latency]),
            _x => {;app_state (_x)} ])
          ;lookbehind_state (lookbehind .attempting (latency, true)) } } } ]) }

var timesup_question = _ => {;
	;app_state (student_app_playing_to_next (S .sample (app_state))) }












var game_clock = new TimelineMax
var game_tick_sampler = temporal ()
;game_clock .add (timesup_question, 10)
;T (R .range (0, 10 + 1)) (
	R .forEach (t => game_clock .add (_ => {;game_tick_sampler (t)}, t)))


var reping_period = 3
var heartbeat = S .data (reping_period) 

var connection = S (_ => {;
	;return T (app_state ()
    ) (under (app_as_room
    ) (_room => {;
			if (! connection [_room]) {
				;connection [_room] = S .data ()
				;api .listen_ping (_room) (connection [_room]) }
			return connection [_room] () && so ((_=_=>
			[ timestamp, mean, Math .sqrt (variance) ],
			where
			, [ mean, variance, n, timestamp ] = connection [_room] () )=>_) })) })




S (_ => {;
  ;so ((
  take
  , cases = 
      [ [ feedback_enter_room
        , ({ room: _room }) => {;
            ;record_room (_room) } ]
      , [ feedback_enter_name
        , ({ name: _name }) => {;
            ;go
            .then (_ => record_student (_name))
            .then (_ => connect_room ()) } ]
      , [ feedback_attempt_question
        , ({ position: _position }) => {;
            ;attempt_question (_position) } ] ] )=>
  so ((_=_=>
  T (just_now (feedback_state)
  ) (
  action),
  where
  , action = 
      Z_ .flip (T (cases) (Z_ .map (_case => so ((_=_=>
        _feedback => {;
          var result = L .get (predicate) (_feedback)
          if (result) {
            ;action (result) } },
        where
        , predicate = _case [0]
        , action = _case [1] )=>_) ))) )=>_)) })





S (_ => {;
	if (L .isDefined (lookbehind_bad_room) (lookbehind_state ())) {
		;var forget = setTimeout (_ => {;
			;lookbehind_state (lookbehind .nothing) }
		, 1500)
		;S .cleanup (_ => {;
			;clearTimeout (forget) }) } })
S (last_app => {;
	if (! L .isDefined (app_as_room) (last_app)) {
		if (L .isDefined (app_as_room) (app_state ())) {
			;lookbehind_state (lookbehind .nothing) } }
	return app_state () }
, app_state ())
S (last_app => {;
	var last_past = T (last_app) (L .get (app_as_past))
	var past = T (app_state ()) (L .get (app_as_past))
	if (L .isDefined (app_as_playing) (app_state ())) {
		if (last_past && past && past_stepped (last_past) (past)) {
			;lookbehind_state (lookbehind .attempting (0, false)) } }
	return app_state () }
, app_state ())
S (_ => {;
	if (L .get (lookbehind_blocked) (lookbehind_state ())) {
		;var forget = setTimeout (_ => {;
			var _since = T (lookbehind_state ()) (L .get (lookbehind_since))
			;lookbehind_state (lookbehind .attempting (_since, false)) }
		, 3000)
		;S .cleanup (_ => {;
			;clearTimeout (forget) }) } })


S (_ => {;
	if (L .isDefined (app_as_get_ready) (app_state ())) {
		;game_clock .pause () } })
S (last_state => {;
	var last_past = T (last_state) (L .get (app_as_past))
	var past = T (app_state ()) (L .get (app_as_past))
	if (L .isDefined (app_as_playing) (app_state ())) {
		if (last_past && past && past_stepped (last_past) (past)) {
			;game_clock .seek (0) }
		;game_clock .play () }
	return app_state () }
, app_state ())
S (_ => {;
	if (L .isDefined (app_as_game_over) (app_state ())) {
		;game_clock .pause () } })


S (last_ensemble => {;
	;so ((
	take
	, _app = S .sample (app_state)
	, _ensemble = ensemble_state () ) => {;
	if (L .isDefined (app_as_get_ready) (_app)) { //c change unready get readies to setup state?
		if (! L .isDefined (ensemble_as_start) (last_ensemble)) {
			if (L .isDefined (ensemble_as_start) (_ensemble)) {
				var start = T (_ensemble) (L .get (ensemble_as_start))
				var now = (new Date) .getTime ()

				var playing_app = student_app_get_ready_to_playing (_app)
				if (start > now) {
					;app_state (playing_app) }
				else {
					;setTimeout (_ => {;
						;app_state (playing_app) }
					, start - now) }

				var _room = T (_app) (L .get (app_as_room))
				var _student = T (_app) (L .get (app_as_student))
				;io_state (io .messaging) && api (_room, post (
					message_encoding (
						message .student_start (_student, start))))
				.catch (_e => {;
					;console .error (_e) })
				.then (_ => {;
					;io_state (io .inert) }) } } } })
	return ensemble_state () }
, ensemble_state ())


S (_ => {;
	;T (app_state ()
  ) (
  under (
    complete_ ({
      _student: app_as_student,
      _room: app_as_room })
	) (({ _student, _room }) => {;
		var phase = heartbeat ()
		var critical = phase === 1
		go
		.then (_ =>
			!! critical && S .sample (connection)
			? io_state (io .messaging) && api (_room, 
					post (messages_encoding (
						so ((_=_=>
						!! (not_playing)
						? [ message .student_ping (_student, S .sample (connection)) ]
						: [ message .student_ping (_student, S .sample (connection))
							, message .student_join (_student, _board)
							, message .student_update (_student, _past) ],
						where
						, { _board, _past, not_playing } =
								$ (Z .fromMaybe
								) ({ not_playing: 'not playing' }
                ) (maybe_all (T (app_state ()) (L .get (L .pick ({
										_board: [ app_as_board, as_maybe ],
										_past: [ app_as_past, as_maybe ] })) ))) )=>_) ))) 
			: io_state (io .heartbeat) && api (_room)
				.then ($ ([
					L .get (L .inverse (data_iso (ensemble .ensemble))),
					_x => {;ensemble_state (_x)} ])) )
		.then (_ => {;
			;setTimeout (_ => {;
				;heartbeat (!! critical ? reping_period : phase - 1) }
			, 300) })
		.catch (_e => {;
			;console .error (_e)
			;setTimeout (_ => {;
				;heartbeat (phase) }
			, 300) })
		.then (_ => {;
			;io_state (io .inert) }) })) })
