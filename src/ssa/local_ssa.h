/*******************************************************************\

Module: SSA

Author: Daniel Kroening, kroening@kroening.com

\*******************************************************************/

#ifndef CPROVER_LOCAL_SSA_H
#define CPROVER_LOCAL_SSA_H

#include <util/std_expr.h>

#include <goto-programs/goto_functions.h>
#include <analyses/natural_loops.h>

#include "../domains/incremental_solver.h"
#include "ssa_domain.h"
#include "guard_map.h"
#include "ssa_object.h"

#define TEMPLATE_PREFIX "__CPROVER_template"
#define TEMPLATE_DECL TEMPLATE_PREFIX
#define TEMPLATE_NEWVAR TEMPLATE_PREFIX "_newvar"
#define TEMPLATE_PARAM_PREFIX TEMPLATE_PREFIX "_param"

class local_SSAt
{
public:
  typedef goto_functionst::goto_functiont goto_functiont;
  typedef goto_programt::const_targett locationt;

  inline local_SSAt(
    const goto_functiont &_goto_function,
    const namespacet &_ns,
    const std::string &_suffix=""):
    ns(_ns), goto_function(_goto_function), 
    current_unwinding(0),
    ssa_objects(_goto_function, ns),
    ssa_value_ai(_goto_function, ns),
    assignments(_goto_function.body, ns, ssa_objects, ssa_value_ai),
    guard_map(_goto_function.body),
    ssa_analysis(assignments),
    suffix(_suffix) 
  {
    build_SSA();
  }
  
  void output(std::ostream &) const;
  void output_verbose(std::ostream &) const;

  // the SSA node for a location
  class nodet
  {
  public:
    inline nodet(
      locationt _location,
      std::list<nodet>::iterator _loophead) 
      : 
        enabling_expr(true_exprt()),
	marked(false),
        location(_location), 
        loophead(_loophead)
      { 
      }

    typedef std::vector<equal_exprt> equalitiest;
    equalitiest equalities;

    typedef std::vector<exprt> constraintst;
    constraintst constraints;

    typedef std::vector<exprt> assertionst;
    assertionst assertions;
    exprt::operandst assertions_after_loop; //for k-induction assertion hoisting
    
    typedef std::vector<function_application_exprt> function_callst;
    function_callst function_calls;

    exprt enabling_expr; //for incremental unwinding
    bool marked; //for incremental unwinding

    //custom invariant templates
    typedef std::vector<exprt> templatest;
    templatest templates;

    locationt location; //link to goto instruction
    std::list<nodet>::iterator loophead; //link to loop head node
       // otherwise points to nodes.end() 

    void output(std::ostream &, const namespacet &) const;

    inline bool empty() const
    {
      return equalities.empty() && constraints.empty() && 
	    assertions.empty() && function_calls.empty();
    }
  };
  
  // turns the assertions in the function into constraints
  void assertions_to_constraints();

  // all the SSA nodes  
  typedef std::list<nodet> nodest;
  nodest nodes;

  void mark_nodes()
  {
    for(nodest::iterator n_it=nodes.begin();
	n_it!=nodes.end(); n_it++) n_it->marked = true;
  }
  void unmark_nodes()
  {
      for(nodest::iterator n_it=nodes.begin();
	        n_it!=nodes.end(); n_it++) n_it->marked = false;
  }

  // for incremental unwinding
  std::list<symbol_exprt> enabling_exprs;
  exprt get_enabling_exprs() const;

  // function entry and exit variables
  typedef std::list<symbol_exprt> var_listt;
  typedef std::set<symbol_exprt> var_sett;
  var_listt params;  
  var_sett globals_in, globals_out;  

  bool has_function_calls() const;

  const namespacet &ns;
  const goto_functiont &goto_function;
  
  // guards
  ssa_objectt cond_symbol() const;
  symbol_exprt cond_symbol(locationt loc) const
  { return name(cond_symbol(), OUT, loc); }
  ssa_objectt guard_symbol() const;
  symbol_exprt guard_symbol(locationt loc) const
  { return name(guard_symbol(), OUT, guard_map[loc].guard_source); }
  exprt edge_guard(locationt from, locationt to) const;
  
  // renaming support for unwinder 
  //   (TODO: this should eventually become the new unwinder)
  typedef hash_map_cont<irep_idt, unsigned, irep_id_hash> 
    unwindings_def_levelst;
  typedef std::vector<unsigned> odometert;
  typedef enum { NONE, PUSH, POP } odometer_modet;
  unwindings_def_levelst unwindings_def_levels;  
  unsigned current_unwinding; //TODO: loop-specific unwindings in future
  std::set<locationt> loopheads; 
  void unwindings_increment(odometert &unwindings, 
				 odometer_modet mode=NONE);
  void unwindings_decrement(odometert &unwindings, 
				 odometer_modet mode=NONE);
  virtual void unwindings_rename(exprt &expr, 
			 const odometert &unwindings) const;

  // auxiliary functions
  enum kindt { PHI, OUT, LOOP_BACK, LOOP_SELECT };
  symbol_exprt name(const ssa_objectt &, kindt kind, locationt loc) const;
  symbol_exprt name(const ssa_objectt &, const ssa_domaint::deft &) const;
  symbol_exprt name_input(const ssa_objectt &) const;
  void replace_side_effects_rec(exprt &, locationt, unsigned &) const;
  exprt read_lhs(const exprt &, locationt loc) const;
  exprt read_rhs(const exprt &, locationt loc) const;
  exprt read_rhs_address_of_rec(const exprt &expr, locationt loc) const;
  exprt read_rhs_rec(const exprt &, locationt loc) const;
  symbol_exprt read_rhs(const ssa_objectt &, locationt loc) const;
  exprt read_node_in(const ssa_objectt &, locationt loc) const;
  void assign_rec(const exprt &lhs, const exprt &rhs, const exprt &guard, locationt loc);

  void get_entry_exit_vars();
  
  bool has_static_lifetime(const ssa_objectt &) const;
  bool has_static_lifetime(const exprt &) const;
  
  exprt dereference(const exprt &expr, locationt loc) const;

  ssa_objectst ssa_objects;
  typedef ssa_objectst::objectst objectst;
  ssa_value_ait ssa_value_ai;
  assignmentst assignments;
  
//protected:
  guard_mapt guard_map;

  ssa_ait ssa_analysis;
  std::string suffix; // an extra suffix

  void get_globals(locationt loc, std::set<symbol_exprt> &globals, 
		   bool rhs_value=true, 
		   bool with_returns=true, 
		   const irep_idt &returns_for_function="") const;

  nodest::iterator find_node(locationt loc);
  nodest::const_iterator find_node(locationt loc) const;
  void find_nodes(locationt loc, std::list<nodest::const_iterator> &_nodes) const;
  locationt find_location_by_number(unsigned location_number) const;
  
protected:
  // build the SSA formulas
  void build_SSA();

  // incoming and outgoing data-flow
  void build_phi_nodes(locationt loc);
  void build_transfer(locationt loc);
  void build_cond(locationt loc);
  void build_guard(locationt loc);
  void build_function_call(locationt loc);
  void build_assertions(locationt loc);
  void assertions_after_loop();

  // custom templates
  void collect_custom_templates();
  replace_mapt template_newvars;
  exprt template_last_newvar;
};

std::list<exprt> & operator <<
  (std::list<exprt> &dest, const local_SSAt &src);

void preprocess_returns(goto_functionst::goto_functiont &goto_function);
symbol_exprt return_symbol(typet type, local_SSAt::locationt loc);

class decision_proceduret & operator <<
  (class decision_proceduret &dest, const local_SSAt &src);

class incremental_solvert & operator <<
  (class incremental_solvert &dest, const local_SSAt &src);

#endif
