/*******************************************************************\

Module: Storage for Function SSAs

Author: Peter Schrammel

\*******************************************************************/

/// \file
/// Storage for Function SSAs

#ifndef CPROVER_2LS_SSA_SSA_DB_H
#define CPROVER_2LS_SSA_SSA_DB_H

#include <util/options.h>

#include <ssa/unwindable_local_ssa.h>
#include <domains/incremental_solver.h>
#include <goto-programs/goto_functions.h>

class ssa_dbt:public messaget
{
public:
  typedef irep_idt function_namet;
  typedef std::map<function_namet, unwindable_local_SSAt*> functionst;
  typedef std::map<function_namet, incremental_solvert*> solverst;

  explicit ssa_dbt(const optionst &_options):
    options(_options)
  {
  }

  ~ssa_dbt()
  {
    for(auto &item : store)
      delete item.second;
    for(auto &item : the_solvers)
      delete item.second;
  }

  inline local_SSAt &get(const function_namet &function_name) const
  {
    return *store.at(function_name);
  }

  inline incremental_solvert &get_solver(const function_namet &function_name)
  {
    solverst::iterator it=the_solvers.find(function_name);
    if(it!=the_solvers.end())
      return *(it->second);

    the_solvers[function_name]=
      incremental_solvert::allocate(
        store.at(function_name)->ns,
        get_message_handler(),
        options.get_bool_option("refine"));
    return *the_solvers.at(function_name);
  }

  inline functionst &functions() { return store; }
  inline solverst &solvers() { return the_solvers; }

  inline bool exists(const function_namet &function_name) const
  {
    return store.find(function_name)!=store.end();
  }

  inline void create(
    const function_namet &function_name,
    const goto_functionst::goto_functiont &goto_function,
    const symbol_tablet &symbol_table)
  {
    store[function_name]=
      new unwindable_local_SSAt(
        function_name,
        goto_function,
        symbol_table,
        options);
  }

protected:
  const optionst &options;
  functionst store;
  solverst the_solvers;
};

#endif
