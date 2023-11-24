/*******************************************************************\

Module: Template Generator for Ranking Functions

Author: Peter Schrammel

\*******************************************************************/

/// \file
/// Template Generator for Ranking Functions

#ifndef CPROVER_2LS_DOMAINS_TEMPLATE_GENERATOR_RANKING_H
#define CPROVER_2LS_DOMAINS_TEMPLATE_GENERATOR_RANKING_H

#include "template_generator_base.h"

#include <ssa/ssa_db.h>
#include <ssa/unwinder.h>

class template_generator_rankingt:public template_generator_baset
{
public:
  explicit template_generator_rankingt(
    optionst &_options,
    ssa_dbt &_ssa_db,
    local_unwindert &_ssa_local_unwinder):
  template_generator_baset(_options, _ssa_db, _ssa_local_unwinder)
  {
  }

  void operator()(
    unsigned _domain_number,
    const local_SSAt &SSA,
    bool forward = true);

protected:
  void collect_variables_ranking(
    const local_SSAt &SSA,
    bool forward);

  void filter_ranking_domain(var_specst &var_specs);
};

#endif // CPROVER_2LS_DOMAINS_TEMPLATE_GENERATOR_RANKING_H
