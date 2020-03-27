/*******************************************************************\

Module: Linear ranking function domain

Author: Peter Schrammel

\*******************************************************************/

/// \file
/// Linear ranking function domain

#ifndef CPROVER_2LS_DOMAINS_LINRANK_DOMAIN_H
#define CPROVER_2LS_DOMAINS_LINRANK_DOMAIN_H

#ifdef DEBUG
#include <iostream>
#endif

#include <util/std_expr.h>
#include <util/arith_tools.h>
#include <util/ieee_float.h>
#include <domains/incremental_solver.h>
#include <set>
#include <vector>

#include "simple_domain.h"

class linrank_domaint:public simple_domaint
{
public:
  struct template_row_exprt:simple_domaint::template_row_exprt
  {
    struct pre_post_valuet
    {
      exprt pre;
      exprt post;

      pre_post_valuet(const exprt &pre, const exprt &post):
        pre(pre), post(post) {}
    };

    std::vector<pre_post_valuet> pre_post_values;
    rowt row;

    std::vector<exprt> get_row_exprs() override;
    void output(std::ostream &out, const namespacet &ns) const override;
  };

  struct row_valuet
  {
    std::vector<exprt> c;

    void set_to_true()
    {
      c.clear();
      c.push_back(true_exprt());
    }
    bool is_true() const { return c[0].get(ID_value)==ID_true; }
    bool is_false() const { return c[0].get(ID_value)==ID_false; }
  };

  struct templ_valuet:simple_domaint::valuet, std::vector<row_valuet>
  {
    exprt get_row_expr(rowt row, const template_rowt &templ_row) const override
    {
      return true_exprt();
    }

    templ_valuet *clone() override { return new templ_valuet(*this); }
  };

  linrank_domaint(
    unsigned _domain_number,
    replace_mapt &_renaming_map,
    unsigned _max_elements, // lexicographic components
    unsigned _max_inner_iterations,
    const namespacet &_ns):
    simple_domaint(_domain_number, _renaming_map, _ns),
    refinement_level(0),
    max_elements(_max_elements),
    max_inner_iterations(_max_inner_iterations),
    number_inner_iterations(0)
  {
    inner_solver=incremental_solvert::allocate(_ns);
  }

  // initialize value
  void initialize_value(domaint::valuet &value) override;

  bool edit_row(const rowt &row, valuet &inv, bool improved) override;

  exprt to_pre_constraints(const valuet &_value) override;

  void make_not_post_constraints(
    const valuet &_value,
    exprt::operandst &cond_exprs) override;

  bool handle_unsat(valuet &value, bool improved) override;

  bool refine() override;

  exprt get_row_symb_constraint(
    row_valuet &symb_values, // contains vars c
    const rowt &row,
    exprt &refinement_constraint);

  // printing
  void output_value(
    std::ostream &out,
    const domaint::valuet &value,
    const namespacet &ns) const override;

  // projection
  void project_on_vars(
    domaint::valuet &value,
    const var_sett &vars,
    exprt &result) override;

  // generating templates
  void add_template(
    const var_specst &var_specs,
    const namespacet &ns);

  unsigned refinement_level;
  // the "inner" solver
  const unsigned max_elements; // lexicographic components
  const unsigned max_inner_iterations;
  incremental_solvert *inner_solver;
  unsigned number_inner_iterations;
};

#endif // CPROVER_2LS_DOMAINS_LINRANK_DOMAIN_H
