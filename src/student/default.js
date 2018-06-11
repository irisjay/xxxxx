var {
  Oo, xx, oo, R, L, S, Z, TimelineMax,
  where, defined, data, do_,
  number, string, list, maybe, id,
  fro, map_just, shuffle, every,
  uuid, post, api,
  board, rendition, rules, setup,
  teacher_app, student_app, io, message, consensus, 
  default_questions, default_rules,
  as_maybe,
  app_get_ready, app_playing, app_game_over,
  app_setup, app_student, app_students, app_room,
  app_board, app_history,
  io_inert, io_connecting,
  consensus_questions,
  rendition_attempts,
  rules_size, setup_size,
  cell_answer, 
  log_consensus,
  student_app_ready_to_during, student_app_next_during,
  crossed_answers, current_question } = window .stuff




var app_state = S .data (student_app .get_ready (Z .Nothing, Z .Nothing))
var io_state = S .data (io .inert)










var clicking = ['click']

var pipeline_student_input = input => {;
  ;input .addEventListener ('keypress', e => {;
    if (e .keyCode === 13) {
      var value = input .value
      ;input .value = ''
      ;make_student (value) }})} 

var pipeline_room_input = input => {;
  ;input .addEventListener ('keypress', e => {;
    if (e .keyCode === 13) {
      var value = input .value
      ;input .value = ''
      ;connect_room (value) }})} 

var pipeline_board_cell = cell => span => {;
  ;clicking .forEach (click => {;
    ;span .addEventListener (click, _ => {;
      ;attempt_question (L .get (cell_answer, cell)) }) }) }

var enter_student_view = <input fn={ pipeline_student_input } placeholder="Enter your name" />
          
var enter_room_view = <input fn={ pipeline_room_input } placeholder="Enter a room code" />

var crossed = _x => <s>{ _x }</s>
var board_view = board => history => <div>
  { Oo (app_state (), oo (current_question), oo (fro ('', _x => <question>{ _x }</question>))) }
  <ticker>{ 10 - tick_sampler () }</ticker>
  <board> { Oo (board, oo (R .map (row => 
    <div> { Oo (row, oo (R .map (cell => Oo (cell,
      oo (L .get (cell_answer)),
      oo (_x => !! (Z .elem (_x) (crossed_answers (app_state ())))
        ? <span>{ crossed (_x) }</span>
        : <span fn={ pipeline_board_cell (cell) }>{ _x }</span> ))))) } </div> ))) } </board> </div>

window .view = <div>
	{ where ((
    x = app_state ()) =>
    !! (L .isDefined (app_get_ready, x))
      ? !! (L .isDefined (io_connecting, io_state ()))
        ? 'Trying to connect...'
        : Oo (L .get ([app_room, as_maybe], x),
          oo (fro (
            Oo (L .get ([app_student, as_maybe], x),
              oo (fro (
                enter_student_view,
                _x => enter_room_view)))),
            _x => 'Connected to room ' + _x))
    : !! (L .isDefined (app_playing, x))
      ? board_view (L .get (app_board, x)) (L .get (app_history, x))
    : undefined) }
</div>














var make_student = name => {{
  ;app_state (student_app .get_ready (Z .Just ([ uuid (), name ]), L .get ([ app_setup, as_maybe ], app_state ()))) }}

var connect_room = id => {{
  ;io_state (io .connecting)
  do_ 
	.then (_ =>
    api (id)
    .then (x => {; if (x .length === 0) { ;throw new Error ('empty') } else return x }) )
	.then (x => {; 
    var consensus = log_consensus (x)
    var questions = L .get (consensus_questions, consensus)
    ;app_state (student_app .get_ready (L .get ([ app_student, as_maybe ], app_state ()), setup .setup (id, questions, default_rules))) })
	.catch (e => { ;console .error (e) })
  .then (_ => {;io_state (io .inert)}) }} 

var valid_attempt = _ => 
  !! (where ((
      current_rendition_attempts = Oo (app_state (), oo (L .get ([app_history, L .last, rendition_attempts, as_maybe])), oo (Z .fromMaybe ([])))) =>
      Z .size (current_rendition_attempts) === 0))
  ? true
  : get_latency (clock .time ()) > 3

var attempt_question = _x => {{
  if (valid_attempt ()) {
    var now = clock .time ()
    var latency = get_latency (now)
    if (Z .equals (Z .Just (_x)) (current_question (app_state ()))) {
      ;Oo (app_state (),
        oo (L .set ([app_history, L .last, rendition_attempts, L .append], [_x, latency])),
        oo (student_app_next_during),
        oo (_x => {;app_state (_x)}))}
    else {
      ;Oo (app_state (),
        oo (L .set ([app_history, L .last, rendition_attempts, L .append], [_x, latency])),
        oo (_x => {;app_state (_x)}))
      ;clock .add ('next', now) } } }}

var timesup_question = _ => {{
  ;app_state (student_app_next_during (app_state ())) }}






var clock = new TimelineMax
clock .add (timesup_question, 10)
Oo (R .range (0, 10 + 1),
  oo (R .forEach (t => clock .add (_ => {;tick_sampler (t)}, t))))

var tick_sampler = S .data (Z .Nothing)

var get_latency = now => {
    var start = clock .getLabelTime ('next')
    if (start === -1) start = 0
    return now - start }



S (_ => {
  if (L .isDefined (app_get_ready, app_state ())) {
    ;clock .pause () } })
S (last_state => {
  if (L .isDefined (app_playing, app_state ())) {
    if (! Z .equals (Z .size (Z .fromMaybe ([]) (L .get ([app_history, as_maybe], last_state)))) (Z .size (L .get (app_history, app_state ())))) {
      ;clock .seek (0)
      ;clock .remove ('fail')}
    ;clock .play () }
  return app_state () }
  , app_state ())
S (_ => {
  if (L .isDefined (app_game_over, app_state ())) {
    ;clock .pause () }})

/*
Oo (student_app_ready_to_during (
    student_app .ready (Z .Just (setup .setup ('test', default_questions, default_rules)))),
  oo (map_just (_x => {;app_state (_x)})))
*/